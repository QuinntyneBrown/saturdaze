using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Catalog;

public class CatalogControllerTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    private readonly HttpClient _client;

    public CatalogControllerTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        _factory.Weather.Producer = (_, _, from, to) =>
        {
            var days = new List<WeatherForecast>();
            for (var d = from; d <= to; d = d.AddDays(1))
                days.Add(new WeatherForecast(d, new[] { "sunny", "warm" }, 24, 16, 0.0, false));
            return days;
        };
    }

    [Fact]
    public async Task Activities_returns_seeded_activities()
    {
        var response = await _client.GetAsync("/api/activities");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var arr = JsonDocument.Parse(body).RootElement;
        arr.GetArrayLength().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Activities_filtered_by_indoor_only_returns_indoor()
    {
        var response = await _client.GetAsync("/api/activities?indoor=true");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var arr = JsonDocument.Parse(body).RootElement.EnumerateArray().ToArray();
        arr.Should().NotBeEmpty();
        arr.Should().OnlyContain(e => e.GetProperty("indoor").GetBoolean());
    }

    [Fact]
    public async Task Restaurants_filtered_by_dinner_slot_returns_dinner()
    {
        var response = await _client.GetAsync("/api/restaurants?day=2026-05-16&slot=Dinner");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var arr = JsonDocument.Parse(body).RootElement.EnumerateArray().ToArray();
        arr.Should().NotBeEmpty();
        arr.Should().OnlyContain(e => e.GetProperty("slot").GetString() == "Dinner");
    }

    [Fact]
    public async Task Restaurant_vote_persists_and_is_returned_with_picks()
    {
        var first = await _client.GetAsync("/api/restaurants?day=2026-05-16&slot=Lunch&wifeApprovedOnly=false");
        first.EnsureSuccessStatusCode();
        var restaurantId = JsonDocument.Parse(await first.Content.ReadAsStringAsync()).RootElement
            .EnumerateArray().First().GetProperty("id").GetGuid();

        var vote = await _client.PostAsJsonAsync(
            $"/api/restaurants/{restaurantId}/vote",
            new { VoterName = "Quinn", Vote = "down" });
        vote.EnsureSuccessStatusCode();

        var next = await _client.GetAsync("/api/restaurants?day=2026-05-16&slot=Lunch&wifeApprovedOnly=false");
        next.EnsureSuccessStatusCode();
        var voted = JsonDocument.Parse(await next.Content.ReadAsStringAsync()).RootElement
            .EnumerateArray()
            .Single(r => r.GetProperty("id").GetGuid() == restaurantId);

        voted.GetProperty("votes").EnumerateArray()
            .Should().Contain(v =>
                v.GetProperty("voterName").GetString() == "Quinn" &&
                v.GetProperty("vote").GetString() == "down");
    }

    [Fact]
    public async Task Restaurant_lock_persists_and_updates_current_weekend_meal()
    {
        _factory.Clock.Today = new DateOnly(2026, 6, 6);
        var current = await _client.GetAsync("/api/weekends/current");
        current.EnsureSuccessStatusCode();

        var picks = await _client.GetAsync("/api/restaurants?day=2026-06-06&slot=Lunch&wifeApprovedOnly=false");
        picks.EnsureSuccessStatusCode();
        var pick = JsonDocument.Parse(await picks.Content.ReadAsStringAsync()).RootElement
            .EnumerateArray().First();
        var restaurantId = pick.GetProperty("id").GetGuid();
        var restaurantName = pick.GetProperty("name").GetString();

        var lockResponse = await _client.PostAsJsonAsync(
            $"/api/restaurants/{restaurantId}/lock",
            new { Day = "Saturday", Slot = "Lunch" });
        lockResponse.EnsureSuccessStatusCode();

        var reloadedPicks = await _client.GetAsync("/api/restaurants?day=2026-06-06&slot=Lunch&wifeApprovedOnly=false");
        var lockedPick = JsonDocument.Parse(await reloadedPicks.Content.ReadAsStringAsync()).RootElement
            .EnumerateArray()
            .Single(r => r.GetProperty("id").GetGuid() == restaurantId);
        lockedPick.GetProperty("locked").GetBoolean().Should().BeTrue();

        var afterLock = JsonDocument.Parse(await (await _client.GetAsync("/api/weekends/current")).Content.ReadAsStringAsync()).RootElement;
        afterLock.GetProperty("blocks").EnumerateArray()
            .Should().Contain(b =>
                b.GetProperty("kind").GetString() == "Meal" &&
                b.GetProperty("isLocked").GetBoolean() &&
                b.GetProperty("title").GetString()!.Contains(restaurantName!));
    }

    [Fact]
    public async Task Events_filtered_by_weekend_overlap()
    {
        var response = await _client.GetAsync("/api/events?weekendOf=2026-06-13");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        JsonDocument.Parse(body).RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }
}
