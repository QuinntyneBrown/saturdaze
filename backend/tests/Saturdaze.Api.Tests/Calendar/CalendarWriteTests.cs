// Acceptance Test
// Traces to: L2-176 AC1-AC6, L2-175 AC3, L2-178 AC1, AC3, AC4
// Description: While a member's Google Calendar is connected, the family's current weekend is kept in it.

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.WebUtilities;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.Calendar;

public class CalendarWriteTests : IClassFixture<SaturdazeApiFactory>, IDisposable
{
    private const string WeekendOf = "2026-05-16";
    private readonly SaturdazeApiFactory _factory;

    public CalendarWriteTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Clock.Today = new DateOnly(2026, 5, 14);
        _factory.Clock.TimeOfDay = TimeSpan.FromHours(9);
        _factory.GoogleCalendar.IsConfigured = true;
        _factory.GoogleCalendar.Unavailable = false;
    }

    public void Dispose()
    {
        _factory.Clock.TimeOfDay = TimeSpan.FromHours(9);
        _factory.GoogleCalendar.Unavailable = false;
    }

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
        await ConnectAsync(session.Client, email);
        return (session, email);
    }

    private async Task ConnectAsync(HttpClient client, string email)
    {
        var authorize = await Read(await client.PostAsync("/api/calendar/google/authorize", content: null));
        var state = QueryHelpers.ParseQuery(new Uri(authorize.GetProperty("authorizationUrl").GetString()!).Query)["state"].ToString();
        await Read(await client.PostAsJsonAsync("/api/calendar/google/connect",
            new { Code = _factory.GoogleCalendar.IssueCode(email), State = state }));
    }

    private static async Task<JsonElement> PlanAsync(HttpClient client)
        => await Read(await client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf }));

    /// <summary>The blocks of a weekend that become events: everything but drives and downtime (L2-176).</summary>
    private static List<JsonElement> Written(JsonElement weekend) =>
        weekend.GetProperty("blocks").EnumerateArray()
            .Where(b => b.GetProperty("kind").GetString() is not ("Drive" or "Downtime")
                && !b.GetProperty("fromCalendar").GetBoolean())
            .ToList();

    private static HashSet<string> Titles(IEnumerable<FakeGoogleCalendarClient.FakeEvent> events)
        => events.Select(e => e.Event.Summary).ToHashSet();

    private static bool Matches(IReadOnlyList<FakeGoogleCalendarClient.FakeEvent> events, JsonElement weekend)
    {
        var blocks = Written(weekend);
        return events.Count == blocks.Count
            && blocks.All(b => events.Any(e => e.Event.BlockId == b.GetProperty("id").GetGuid()));
    }

    [Fact]
    public async Task Generating_the_weekend_writes_one_event_per_block_except_drives_and_downtime()
    {
        // Traces to: L2-176 AC1
        var (session, email) = await ConnectedMemberAsync();

        var weekend = await PlanAsync(session.Client);

        var events = await _factory.GoogleCalendar.WaitForEventsAsync(email, e => Matches(e, weekend));
        Matches(events, weekend).Should().BeTrue("one event per block that is not a drive or downtime");
        foreach (var block in Written(weekend))
        {
            var written = events.Single(e => e.Event.BlockId == block.GetProperty("id").GetGuid()).Event;
            var date = block.GetProperty("day").GetString() == "Saturday" ? new DateOnly(2026, 5, 16) : new DateOnly(2026, 5, 17);
            written.Summary.Should().Be(block.GetProperty("title").GetString());
            written.Start.Should().Be(date.ToDateTime(TimeOnly.Parse(block.GetProperty("startTime").GetString()!)));
            written.End.Should().Be(date.ToDateTime(TimeOnly.Parse(block.GetProperty("endTime").GetString()!)));
            written.TimeZone.Should().Be("America/Toronto");
            written.Description.Should().Be("Part of This weekend. Planned with Saturdaze.");
        }
    }

    [Fact]
    public async Task Regenerating_replaces_the_events_of_replanned_blocks_and_leaves_locked_ones_alone()
    {
        // Traces to: L2-176 AC2
        var (session, email) = await ConnectedMemberAsync();
        var first = await PlanAsync(session.Client);
        var before = await _factory.GoogleCalendar.WaitForEventsAsync(email, e => Matches(e, first));
        var lockedIds = Written(first).Where(b => b.GetProperty("isLocked").GetBoolean())
            .Select(b => b.GetProperty("id").GetGuid()).ToHashSet();

        var id = first.GetProperty("id").GetGuid();
        await Read(await session.Client.PostAsync($"/api/weekends/{id}/regenerate", null));
        var second = await Read(await session.Client.GetAsync($"/api/weekends/{id}"));

        var after = await _factory.GoogleCalendar.WaitForEventsAsync(email, e => Matches(e, second));
        Matches(after, second).Should().BeTrue();
        foreach (var locked in before.Where(e => lockedIds.Contains(e.Event.BlockId)))
            after.Should().ContainSingle(e => e.Id == locked.Id && e.Version == 1, "locked blocks keep their event untouched");
    }

    [Fact]
    public async Task Renaming_adding_an_errand_and_swapping_are_followed_in_the_calendar()
    {
        // Traces to: L2-176 AC3
        var (session, email) = await ConnectedMemberAsync();
        var weekend = await PlanAsync(session.Client);
        var id = weekend.GetProperty("id").GetGuid();
        await _factory.GoogleCalendar.WaitForEventsAsync(email, e => Matches(e, weekend));

        weekend = await Read(await session.Client.PutAsJsonAsync($"/api/weekends/{id}/title", new { Title = "Lavender weekend" }));
        var renamed = await _factory.GoogleCalendar.WaitForEventsAsync(email,
            e => e.All(x => x.Event.Description == "Part of Lavender weekend. Planned with Saturdaze."));
        renamed.Should().OnlyContain(x => x.Event.Description == "Part of Lavender weekend. Planned with Saturdaze.");

        weekend = await Read(await session.Client.PostAsJsonAsync($"/api/weekends/{id}/errands",
            new { Description = "Costco run", EstimatedMinutes = 60 }));
        var withErrand = await _factory.GoogleCalendar.WaitForEventsAsync(email, e => Matches(e, weekend));
        Matches(withErrand, weekend).Should().BeTrue();
        Titles(withErrand).Should().Contain(t => t.Contains("Costco run"));

        var activity = Written(weekend).FirstOrDefault(b =>
            b.GetProperty("kind").GetString() == "Activity" && !b.GetProperty("isLocked").GetBoolean());
        if (activity.ValueKind == JsonValueKind.Object)
        {
            weekend = await Read(await session.Client.PostAsJsonAsync(
                $"/api/blocks/{activity.GetProperty("id").GetGuid()}/swap", new { RejectedActivityIds = Array.Empty<Guid>() }));
            var swapped = await _factory.GoogleCalendar.WaitForEventsAsync(email, e => Matches(e, weekend));
            Matches(swapped, weekend).Should().BeTrue();
        }
    }

    [Fact]
    public async Task A_google_outage_never_fails_the_request_and_the_write_is_retried()
    {
        // Traces to: L2-176 AC4
        var (session, email) = await ConnectedMemberAsync();
        _factory.GoogleCalendar.Unavailable = true;

        var response = await session.Client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var weekend = await Read(response);
        await Task.Delay(1500);
        _factory.GoogleCalendar.EventsOf(email).Should().BeEmpty();

        _factory.GoogleCalendar.Unavailable = false;
        _factory.Clock.TimeOfDay += TimeSpan.FromMinutes(2);
        var events = await _factory.GoogleCalendar.WaitForEventsAsync(email, e => Matches(e, weekend));
        Matches(events, weekend).Should().BeTrue("the retry writes the weekend once Google answers and the back-off is due");
    }

    [Fact]
    public async Task A_write_whose_answer_was_lost_is_retried_without_a_duplicate_event()
    {
        // Traces to: L2-176 AC4
        var (session, email) = await ConnectedMemberAsync();
        _factory.GoogleCalendar.LoseNextInsertAnswer(email);

        var weekend = await PlanAsync(session.Client);
        await Task.Delay(1500);
        _factory.Clock.TimeOfDay += TimeSpan.FromMinutes(2);

        var events = await _factory.GoogleCalendar.WaitForEventsAsync(email, e => Matches(e, weekend));
        await Task.Delay(1500);
        events = _factory.GoogleCalendar.EventsOf(email);
        Matches(events, weekend).Should().BeTrue("the retry finds the event Google already wrote instead of adding a second");
    }

    [Fact]
    public async Task An_event_deleted_in_google_is_written_again_on_the_next_change()
    {
        // Traces to: L2-176 AC5
        var (session, email) = await ConnectedMemberAsync();
        var weekend = await PlanAsync(session.Client);
        var events = await _factory.GoogleCalendar.WaitForEventsAsync(email, e => Matches(e, weekend));
        var gone = events.First();
        _factory.GoogleCalendar.DeleteInGoogle(email, gone.Id);

        weekend = await Read(await session.Client.PutAsJsonAsync(
            $"/api/weekends/{weekend.GetProperty("id").GetGuid()}/title", new { Title = "Renamed" }));

        var after = await _factory.GoogleCalendar.WaitForEventsAsync(email, e => Matches(e, weekend));
        after.Should().Contain(e => e.Event.BlockId == gone.Event.BlockId);
    }

    [Fact]
    public async Task A_member_who_is_not_connected_causes_no_calls_to_google()
    {
        // Traces to: L2-176 AC6, L2-175 AC3
        var (session, email) = await ConnectedMemberAsync();
        (await session.Client.DeleteAsync("/api/calendar/google")).StatusCode.Should().Be(HttpStatusCode.NoContent);
        var callsBefore = _factory.GoogleCalendar.CallsFor(email);

        var weekend = await PlanAsync(session.Client);
        await Read(await session.Client.PostAsync($"/api/weekends/{weekend.GetProperty("id").GetGuid()}/regenerate", null));
        await Task.Delay(1500);

        _factory.GoogleCalendar.CallsFor(email).Should().Be(callsBefore);
    }

    [Fact]
    public async Task A_refused_grant_marks_the_connection_for_reconnecting_and_stops_writing_until_then()
    {
        // Traces to: L2-178 AC1, AC3, AC4
        var (session, email) = await ConnectedMemberAsync();
        _factory.GoogleCalendar.RevokeInGoogle(email);

        var weekend = await PlanAsync(session.Client);

        var status = await WaitForStatusAsync(session.Client, "needs_reconnect");
        status.Should().Be("needs_reconnect");
        var calls = _factory.GoogleCalendar.CallsFor(email);
        await Read(await session.Client.PutAsJsonAsync($"/api/weekends/{weekend.GetProperty("id").GetGuid()}/title", new { Title = "Again" }));
        await Task.Delay(1500);
        _factory.GoogleCalendar.CallsFor(email).Should().Be(calls, "no write is attempted for a connection that needs reconnecting");

        weekend = await Read(await session.Client.GetAsync("/api/weekends/current"));
        await ConnectAsync(session.Client, email);
        (await WaitForStatusAsync(session.Client, "connected")).Should().Be("connected");
        var events = await _factory.GoogleCalendar.WaitForEventsAsync(email, e => Matches(e, weekend));
        Matches(events, weekend).Should().BeTrue("connecting again writes the current weekend");
    }

    private static async Task<string?> WaitForStatusAsync(HttpClient client, string expected)
    {
        string? status = null;
        for (var i = 0; i < 100; i++)
        {
            var settings = await Read(await client.GetAsync("/api/calendar"));
            status = settings.GetProperty("google").ValueKind == JsonValueKind.Object
                ? settings.GetProperty("google").GetProperty("status").GetString()
                : null;
            if (status == expected) return status;
            await Task.Delay(100);
        }
        return status;
    }
}
