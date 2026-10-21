// Acceptance Test
// Traces to: L2-169 AC1, AC2, AC4, AC5, AC7, L2-170 AC1, AC2, AC5, L2-173 AC2
// Description: Timed events on the upcoming weekend in a connected calendar become locked commitment blocks.

using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.WebUtilities;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Calendar;
using Xunit;

namespace Saturdaze.Api.Tests.Calendar;

public class CalendarCommitmentTests : IClassFixture<SaturdazeApiFactory>, IDisposable
{
    private const string WeekendOf = "2026-05-16";
    /// <summary>Eastern daylight time on the test weekend, the configured America/Toronto.</summary>
    private static readonly TimeSpan Edt = TimeSpan.FromHours(-4);
    private readonly SaturdazeApiFactory _factory;

    public CalendarCommitmentTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Clock.Today = new DateOnly(2026, 5, 14);
        _factory.Clock.TimeOfDay = TimeSpan.FromHours(9);
        _factory.GoogleCalendar.IsConfigured = true;
        _factory.GoogleCalendar.Unavailable = false;
        _factory.GoogleCalendar.ListDelay = TimeSpan.Zero;
    }

    public void Dispose() => _factory.GoogleCalendar.ListDelay = TimeSpan.Zero;

    private static async Task<JsonElement> Read(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();
        response.IsSuccessStatusCode.Should().BeTrue(body);
        return JsonDocument.Parse(body).RootElement.Clone();
    }

    private async Task<(SignedInClient.Session Session, string Email)> ConnectedMemberAsync()
    {
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var email = $"cal-{Guid.NewGuid():N}@example.com";
        var authorize = await Read(await session.Client.PostAsync("/api/calendar/google/authorize", content: null));
        var state = QueryHelpers.ParseQuery(new Uri(authorize.GetProperty("authorizationUrl").GetString()!).Query)["state"].ToString();
        await Read(await session.Client.PostAsJsonAsync("/api/calendar/google/connect",
            new { Code = _factory.GoogleCalendar.IssueCode(email), State = state }));
        return (session, email);
    }

    private static GoogleCalendarEvent Timed(string title, int day, int startHour, int endHour, int endDay = -1,
        bool declined = false, bool free = false, bool cancelled = false, bool saturdaze = false)
        => new($"own-{Guid.NewGuid():N}", title,
            new DateTimeOffset(2026, 5, day, startHour, 0, 0, Edt),
            new DateTimeOffset(2026, 5, endDay < 0 ? day : endDay, endHour, 0, 0, Edt),
            AllDay: false, Cancelled: cancelled, Declined: declined, Free: free, WrittenBySaturdaze: saturdaze);

    private static async Task<JsonElement> PlanAsync(HttpClient client)
        => await Read(await client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf }));

    private static List<JsonElement> CalendarBlocks(JsonElement weekend) =>
        weekend.GetProperty("blocks").EnumerateArray().Where(b => b.GetProperty("fromCalendar").GetBoolean()).ToList();

    private static (string Day, string Start, string End) Window(JsonElement b) =>
        (b.GetProperty("day").GetString()!, b.GetProperty("startTime").GetString()!, b.GetProperty("endTime").GetString()!);

    [Fact]
    public async Task A_weekend_event_becomes_a_locked_commitment_block_nothing_overlaps()
    {
        // Traces to: L2-169 AC1
        var (session, email) = await ConnectedMemberAsync();
        _factory.GoogleCalendar.AddOwnEvent(email, Timed("Ava's birthday party", 16, 15, 17));

        var weekend = await PlanAsync(session.Client);

        var party = CalendarBlocks(weekend).Should().ContainSingle().Subject;
        party.GetProperty("title").GetString().Should().Be("Ava's birthday party");
        party.GetProperty("kind").GetString().Should().Be("Commitment");
        party.GetProperty("isLocked").GetBoolean().Should().BeTrue();
        Window(party).Should().Be(("Saturday", "15:00:00", "17:00:00"));
        weekend.GetProperty("blocks").EnumerateArray()
            .Where(b => b.GetProperty("day").GetString() == "Saturday" && b.GetProperty("id").GetGuid() != party.GetProperty("id").GetGuid())
            .Should().OnlyContain(b => string.CompareOrdinal(b.GetProperty("endTime").GetString(), "15:00:00") <= 0
                || string.CompareOrdinal(b.GetProperty("startTime").GetString(), "17:00:00") >= 0);
    }

    [Fact]
    public async Task All_day_declined_free_cancelled_and_saturdaze_events_are_left_out()
    {
        // Traces to: L2-169 AC2
        var (session, email) = await ConnectedMemberAsync();
        var calendar = _factory.GoogleCalendar;
        calendar.AddOwnEvent(email, new GoogleCalendarEvent("all-day", "Long weekend", new DateTimeOffset(2026, 5, 16, 0, 0, 0, Edt),
            new DateTimeOffset(2026, 5, 18, 0, 0, 0, Edt), AllDay: true, Cancelled: false, Declined: false, Free: false, WrittenBySaturdaze: false));
        calendar.AddOwnEvent(email, Timed("Declined lunch", 16, 12, 13, declined: true));
        calendar.AddOwnEvent(email, Timed("Free block", 16, 14, 15, free: true));
        calendar.AddOwnEvent(email, Timed("Cancelled game", 17, 14, 15, cancelled: true));
        calendar.AddOwnEvent(email, Timed("Old Saturdaze stop", 17, 15, 16, saturdaze: true));

        var weekend = await PlanAsync(session.Client);

        CalendarBlocks(weekend).Should().BeEmpty();
    }

    [Fact]
    public async Task An_event_over_midnight_is_split_by_day_and_clipped_to_the_planner_day()
    {
        // Traces to: L2-169 AC4
        var (session, email) = await ConnectedMemberAsync();
        _factory.GoogleCalendar.AddOwnEvent(email, Timed("Cottage overnight", 16, 20, 10, endDay: 17));

        var weekend = await PlanAsync(session.Client);

        CalendarBlocks(weekend).Select(Window).Should().BeEquivalentTo(new[]
        {
            ("Saturday", "20:00:00", "21:00:00"),
            ("Sunday", "09:00:00", "10:00:00"),
        });
    }

    [Fact]
    public async Task With_plan_around_my_calendar_off_no_event_becomes_a_block()
    {
        // Traces to: L2-169 AC5
        var (session, email) = await ConnectedMemberAsync();
        _factory.GoogleCalendar.AddOwnEvent(email, Timed("Ava's birthday party", 16, 15, 17));
        await Read(await session.Client.PutAsJsonAsync("/api/calendar/google", new { ReadCommitments = false }));

        var weekend = await PlanAsync(session.Client);

        CalendarBlocks(weekend).Should().BeEmpty();
    }

    [Fact]
    public async Task A_calendar_block_cannot_be_unlocked_and_a_share_link_titles_it_busy()
    {
        // Traces to: L2-169 AC7, L2-011
        var (session, email) = await ConnectedMemberAsync();
        _factory.GoogleCalendar.AddOwnEvent(email, Timed("Therapy", 17, 13, 14));
        var weekend = await PlanAsync(session.Client);
        var block = CalendarBlocks(weekend).Single();

        var unlock = await session.Client.PutAsJsonAsync($"/api/blocks/{block.GetProperty("id").GetGuid()}/lock", new { Locked = false });
        unlock.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var share = await Read(await session.Client.PostAsync($"/api/weekends/{weekend.GetProperty("id").GetGuid()}/share", null));
        var shared = await Read(await _factory.CreateClient().GetAsync($"/api/weekends/shared/{share.GetProperty("token").GetString()}"));
        var sharedBlock = shared.GetProperty("blocks").EnumerateArray().Single(b => b.GetProperty("id").GetGuid() == block.GetProperty("id").GetGuid());
        sharedBlock.GetProperty("title").GetString().Should().Be("Busy");
        shared.GetRawText().Should().NotContain("Therapy");
    }

    [Fact]
    public async Task A_calendar_block_is_not_written_back_to_the_calendar()
    {
        // Traces to: L2-168 (never a calendar-sourced block)
        var (session, email) = await ConnectedMemberAsync();
        _factory.GoogleCalendar.AddOwnEvent(email, Timed("Ava's birthday party", 16, 15, 17));

        var weekend = await PlanAsync(session.Client);

        var block = CalendarBlocks(weekend).Single();
        var events = await _factory.GoogleCalendar.WaitForEventsAsync(email, e => e.Count > 0);
        events.Should().NotBeEmpty();
        await Task.Delay(500);
        _factory.GoogleCalendar.EventsOf(email).Should().NotContain(e => e.Event.BlockId == block.GetProperty("id").GetGuid());
    }

    [Fact]
    public async Task A_refused_grant_on_the_read_still_plans_and_marks_the_connection()
    {
        // Traces to: L2-170 AC1
        var (session, email) = await ConnectedMemberAsync();
        _factory.GoogleCalendar.AddOwnEvent(email, Timed("Ava's birthday party", 16, 15, 17));
        _factory.GoogleCalendar.RevokeInGoogle(email);

        var response = await session.Client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        CalendarBlocks(await Read(response)).Should().BeEmpty();
        var settings = await Read(await session.Client.GetAsync("/api/calendar"));
        settings.GetProperty("google").GetProperty("status").GetString().Should().Be("needs_reconnect");
    }

    [Fact]
    public async Task A_slow_google_is_given_up_on_and_the_weekend_is_planned_without_it()
    {
        // Traces to: L2-170 AC2
        var (session, email) = await ConnectedMemberAsync();
        _factory.GoogleCalendar.AddOwnEvent(email, Timed("Ava's birthday party", 16, 15, 17));
        _factory.GoogleCalendar.ListDelay = TimeSpan.FromSeconds(30);
        var watch = Stopwatch.StartNew();

        var response = await session.Client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf });

        watch.Elapsed.Should().BeLessThan(TimeSpan.FromSeconds(15));
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        CalendarBlocks(await Read(response)).Should().BeEmpty();
    }

    [Fact]
    public async Task Planning_one_family_never_reads_another_familys_calendar()
    {
        // Traces to: L2-173 AC2
        var (_, email) = await ConnectedMemberAsync();
        var other = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var reads = _factory.GoogleCalendar.Calls.Count(c => c.Call == "list" && c.Email == email);

        await PlanAsync(other.Client);

        _factory.GoogleCalendar.Calls.Count(c => c.Call == "list" && c.Email == email).Should().Be(reads);
    }

    [Fact]
    public async Task Calendar_titles_never_reach_the_logs()
    {
        // Traces to: L2-170 AC5
        var (session, email) = await ConnectedMemberAsync();
        var title = $"Private appointment {Guid.NewGuid():N}";
        _factory.GoogleCalendar.AddOwnEvent(email, Timed(title, 17, 13, 14));

        await PlanAsync(session.Client);
        await _factory.GoogleCalendar.WaitForEventsAsync(email, e => e.Count > 0);

        _factory.Logs.Messages.Should().NotContain(m => m.Contains(title));
    }
}
