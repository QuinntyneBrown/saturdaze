// Acceptance Test
// Traces to: L2-178 AC1-AC7, L2-180 AC4, L2-008
// Description: A family's private subscription link serves its current weekend to any calendar app.

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Calendar;

public class CalendarFeedTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public CalendarFeedTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Clock.Today = new DateOnly(2026, 5, 14);
    }

    private static async Task<JsonElement> Read(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();
        response.IsSuccessStatusCode.Should().BeTrue(body);
        return JsonDocument.Parse(body).RootElement.Clone();
    }

    private static async Task<JsonElement> CreateFeedAsync(HttpClient client)
    {
        var response = await client.PostAsync("/api/calendar/feed", content: null);
        response.StatusCode.Should().Be(HttpStatusCode.Created, await response.Content.ReadAsStringAsync());
        return await Read(response);
    }

    /// <summary>The path of a feed URL, so the in-process client can fetch it.</summary>
    private static string PathOf(JsonElement feed) => new Uri(feed.GetProperty("url").GetString()!).PathAndQuery;

    private static string TokenOf(JsonElement feed)
    {
        var path = PathOf(feed);
        return path[(path.LastIndexOf('/') + 1)..^".ics".Length];
    }

    [Fact]
    public async Task Creating_a_link_returns_an_https_and_a_webcal_url_and_stores_only_the_hash()
    {
        // Traces to: L2-178 AC1
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var feed = await CreateFeedAsync(session.Client);

        var url = feed.GetProperty("url").GetString()!;
        var webcal = feed.GetProperty("webcalUrl").GetString()!;
        url.Should().MatchRegex(@"^https?://[^/]+/api/calendar/feed/[A-Za-z0-9_-]{20,}\.ics$");
        webcal.Should().StartWith("webcal://").And.EndWith(".ics");
        new Uri(webcal).PathAndQuery.Should().Be(PathOf(feed));

        var token = TokenOf(feed);
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var stored = await db.CalendarFeeds.SingleAsync(f => f.FamilyId == session.FamilyId);
        stored.TokenHash.Should().NotBe(token).And.NotContain(token);
    }

    [Fact]
    public async Task The_link_serves_the_current_weekend_without_a_bearer()
    {
        // Traces to: L2-178 AC2, L2-008
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Seeded);
        var weekend = await Read(await session.Client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = "2026-05-16" }));
        var feed = await CreateFeedAsync(session.Client);

        var response = await _factory.CreateClient().GetAsync(PathOf(feed));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType!.MediaType.Should().Be("text/calendar");
        var ics = await response.Content.ReadAsStringAsync();
        var blocks = weekend.GetProperty("blocks").EnumerateArray().ToList();
        var expected = blocks.Where(b => b.GetProperty("kind").GetString() is not ("Drive" or "Downtime")).ToList();
        expected.Should().NotBeEmpty();
        CountEvents(ics).Should().Be(expected.Count);
        foreach (var block in expected)
            ics.Should().Contain($"UID:{block.GetProperty("id").GetGuid()}@saturdaze");
        foreach (var block in blocks.Where(b => b.GetProperty("kind").GetString() is "Drive" or "Downtime"))
            ics.Should().NotContain(block.GetProperty("id").GetGuid().ToString());
        foreach (var block in blocks.Where(b => b.GetProperty("reason").GetString() is { Length: > 0 }))
            ics.Should().NotContain(block.GetProperty("reason").GetString()!);
        var first = expected.First(b => b.GetProperty("day").GetString() == "Saturday");
        var start = TimeOnly.Parse(first.GetProperty("startTime").GetString()!);
        ics.Should().Contain($"DTSTART:20260516T{start:HHmmss}");
    }

    [Fact]
    public async Task A_family_without_a_current_weekend_gets_an_empty_calendar()
    {
        // Traces to: L2-178 AC3
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var feed = await CreateFeedAsync(session.Client);

        var response = await _factory.CreateClient().GetAsync(PathOf(feed));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var ics = await response.Content.ReadAsStringAsync();
        ics.Should().Contain("BEGIN:VCALENDAR").And.Contain("END:VCALENDAR");
        CountEvents(ics).Should().Be(0);
    }

    [Fact]
    public async Task A_new_link_replaces_the_old_one()
    {
        // Traces to: L2-178 AC4
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var first = await CreateFeedAsync(session.Client);
        var second = await CreateFeedAsync(session.Client);
        var anonymous = _factory.CreateClient();

        TokenOf(second).Should().NotBe(TokenOf(first));
        (await anonymous.GetAsync(PathOf(first))).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await anonymous.GetAsync(PathOf(second))).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Stopping_the_link_retires_it_and_the_settings_say_so()
    {
        // Traces to: L2-178 AC5
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var feed = await CreateFeedAsync(session.Client);
        var settings = await Read(await session.Client.GetAsync("/api/calendar"));
        settings.GetProperty("feed").GetProperty("active").GetBoolean().Should().BeTrue();
        settings.GetRawText().Should().NotContain(TokenOf(feed));

        (await session.Client.DeleteAsync("/api/calendar/feed")).StatusCode.Should().Be(HttpStatusCode.NoContent);

        (await _factory.CreateClient().GetAsync(PathOf(feed))).StatusCode.Should().Be(HttpStatusCode.NotFound);
        settings = await Read(await session.Client.GetAsync("/api/calendar"));
        settings.GetProperty("feed").GetProperty("active").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public async Task Another_family_cannot_stop_the_link_and_the_link_serves_only_its_own_family()
    {
        // Traces to: L2-178 AC6, L2-180 AC4
        var first = await SignedInClient.CreateAsync(_factory, FamilyMode.Seeded);
        var weekend = await Read(await first.Client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = "2026-05-16" }));
        var feed = await CreateFeedAsync(first.Client);
        var other = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var otherWeekend = await Read(await other.Client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = "2026-05-16" }));

        (await other.Client.DeleteAsync("/api/calendar/feed")).StatusCode.Should().Be(HttpStatusCode.NoContent);

        var response = await _factory.CreateClient().GetAsync(PathOf(feed));
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var ics = await response.Content.ReadAsStringAsync();
        var own = weekend.GetProperty("blocks").EnumerateArray()
            .First(b => b.GetProperty("kind").GetString() is "Activity" or "Meal" or "Commitment");
        ics.Should().Contain(own.GetProperty("id").GetGuid().ToString());
        foreach (var block in otherWeekend.GetProperty("blocks").EnumerateArray())
            ics.Should().NotContain(block.GetProperty("id").GetGuid().ToString());
    }

    [Fact]
    public async Task Fetching_the_link_never_writes_its_token_to_the_logs()
    {
        // Traces to: L2-177 AC5, L2-180
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var feed = await CreateFeedAsync(session.Client);

        (await _factory.CreateClient().GetAsync(PathOf(feed))).StatusCode.Should().Be(HttpStatusCode.OK);

        _factory.Logs.Messages.Should().Contain(m => m.Contains("/api/calendar/feed/"));
        _factory.Logs.Messages.Should().NotContain(m => m.Contains(TokenOf(feed)));
    }

    [Fact]
    public async Task An_unknown_token_is_not_found()
    {
        // Traces to: L2-178 AC7
        var response = await _factory.CreateClient().GetAsync("/api/calendar/feed/not-a-real-token-at-all-000000.ics");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Managing_the_link_needs_a_bearer()
    {
        // Traces to: L2-172 AC8, L2-008
        var anonymous = _factory.CreateClient();
        (await anonymous.GetAsync("/api/calendar")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await anonymous.PostAsync("/api/calendar/feed", content: null)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await anonymous.DeleteAsync("/api/calendar/feed")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    private static int CountEvents(string ics) =>
        ics.Split('\n').Count(l => l.TrimEnd('\r') == "BEGIN:VEVENT");
}
