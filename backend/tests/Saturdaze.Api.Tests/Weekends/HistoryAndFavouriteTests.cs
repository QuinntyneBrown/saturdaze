using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Weekends;

public class HistoryAndFavouriteTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private HttpClient _client = null!;

    public HistoryAndFavouriteTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = (_, _, from, to) =>
        {
            var days = new List<WeatherForecast>();
            for (var d = from; d <= to; d = d.AddDays(1))
                days.Add(new WeatherForecast(d, new[] { "sunny", "warm" }, 24, 16, 0.0, false));
            return days;
        };
    }

    public async Task InitializeAsync() => _client = (await SignedInClient.CreateAsync(_factory)).Client;
    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task History_returns_planned_weekends_descending_by_date()
    {
        // Past weekends: the clock's current weekend is 2026-05-16 (L2-025).
        var d1 = new DateOnly(2026, 5, 2);
        var d2 = new DateOnly(2026, 5, 9);
        (await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = d1.ToString("yyyy-MM-dd") }))
            .EnsureSuccessStatusCode();
        (await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = d2.ToString("yyyy-MM-dd") }))
            .EnsureSuccessStatusCode();

        var resp = await _client.GetAsync("/api/weekends/history");
        resp.EnsureSuccessStatusCode();
        var dates = JsonDocument.Parse(await resp.Content.ReadAsStringAsync()).RootElement
            .EnumerateArray()
            .Select(e => e.GetProperty("weekendOf").GetString())
            .ToArray();
        dates.Should().Contain("2026-05-02").And.Contain("2026-05-09");
        // Strictly descending.
        dates.Should().BeInDescendingOrder();
    }

    [Fact]
    public async Task History_with_take_zero_returns_400()
    {
        // Traces to: L2-025 #2
        var resp = await _client.GetAsync("/api/weekends/history?take=0");
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Rating_and_title_persist_and_surface_in_history()
    {
        // Traces to: L2-026, L1-010
        var d = new DateOnly(2026, 4, 11);
        var created = await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = d.ToString("yyyy-MM-dd") });
        created.EnsureSuccessStatusCode();
        var id = JsonDocument.Parse(await created.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid();

        var rate = await _client.PutAsJsonAsync($"/api/weekends/{id}/rating", new { Rating = 4 });
        rate.EnsureSuccessStatusCode();
        JsonDocument.Parse(await rate.Content.ReadAsStringAsync()).RootElement.GetProperty("rating").GetInt32().Should().Be(4);

        var rename = await _client.PutAsJsonAsync($"/api/weekends/{id}/title", new { Title = "  Bronte + Rec Room " });
        rename.EnsureSuccessStatusCode();
        JsonDocument.Parse(await rename.Content.ReadAsStringAsync()).RootElement.GetProperty("title").GetString().Should().Be("Bronte + Rec Room");

        var history = JsonDocument.Parse(await (await _client.GetAsync("/api/weekends/history")).Content.ReadAsStringAsync()).RootElement
            .EnumerateArray().Single(w => w.GetProperty("id").GetGuid() == id);
        history.GetProperty("rating").GetInt32().Should().Be(4);
        history.GetProperty("title").GetString().Should().Be("Bronte + Rec Room");

        var tooHigh = await _client.PutAsJsonAsync($"/api/weekends/{id}/rating", new { Rating = 9 });
        tooHigh.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var cleared = await _client.PutAsJsonAsync($"/api/weekends/{id}/rating", new { Rating = (int?)null });
        cleared.EnsureSuccessStatusCode();
        JsonDocument.Parse(await cleared.Content.ReadAsStringAsync()).RootElement.GetProperty("rating").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task History_leaves_out_the_current_and_later_weekends_and_counts_the_past_ones()
    {
        // Traces to: L2-025 AC4
        var family = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        foreach (var date in new[] { "2026-05-02", "2026-05-09", "2026-05-16", "2026-05-23" })
            (await family.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = date })).EnsureSuccessStatusCode();

        var resp = await family.GetAsync("/api/weekends/history");
        resp.EnsureSuccessStatusCode();

        Dates(await resp.Content.ReadAsStringAsync()).Should().Equal("2026-05-09", "2026-05-02");
        resp.Headers.GetValues("X-Total-Count").Single().Should().Be("2");
    }

    [Fact]
    public async Task History_continues_before_the_oldest_weekend_received()
    {
        // Traces to: L2-025 AC5
        var family = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        foreach (var date in new[] { "2026-04-11", "2026-04-18", "2026-04-25", "2026-05-02", "2026-05-09" })
            (await family.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = date })).EnsureSuccessStatusCode();

        async Task<string[]> Page(string query)
        {
            var resp = await family.GetAsync("/api/weekends/history" + query);
            resp.EnsureSuccessStatusCode();
            resp.Headers.GetValues("X-Total-Count").Single().Should().Be("5");
            return Dates(await resp.Content.ReadAsStringAsync());
        }

        (await Page("?take=2")).Should().Equal("2026-05-09", "2026-05-02");
        (await Page("?take=2&before=2026-05-02")).Should().Equal("2026-04-25", "2026-04-18");
        (await Page("?take=2&before=2026-04-18")).Should().Equal("2026-04-11");
    }

    private static string[] Dates(string json) =>
        JsonDocument.Parse(json).RootElement.EnumerateArray()
            .Select(e => e.GetProperty("weekendOf").GetString()!)
            .ToArray();

    [Fact]
    public async Task Favourite_toggles_persisted_state()
    {
        var d = new DateOnly(2026, 6, 6);
        var created = await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = d.ToString("yyyy-MM-dd") });
        created.EnsureSuccessStatusCode();
        var id = JsonDocument.Parse(await created.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid();

        var put = await _client.PutAsJsonAsync($"/api/weekends/{id}/favourite", new { Favourite = true });
        put.EnsureSuccessStatusCode();
        JsonDocument.Parse(await put.Content.ReadAsStringAsync()).RootElement
            .GetProperty("isFavourite").GetBoolean().Should().BeTrue();

        var get = await _client.GetAsync($"/api/weekends/{id}");
        JsonDocument.Parse(await get.Content.ReadAsStringAsync()).RootElement
            .GetProperty("isFavourite").GetBoolean().Should().BeTrue();
    }
}
