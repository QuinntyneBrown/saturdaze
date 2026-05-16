using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Weekends;

public class HistoryAndFavouriteTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    private readonly HttpClient _client;

    public HistoryAndFavouriteTests(SaturdazeApiFactory factory)
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
    public async Task History_returns_planned_weekends_descending_by_date()
    {
        var d1 = new DateOnly(2026, 5, 16);
        var d2 = new DateOnly(2026, 5, 23);
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
        dates.Should().Contain("2026-05-16").And.Contain("2026-05-23");
        // Strictly descending.
        dates.Should().BeInDescendingOrder();
    }

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
