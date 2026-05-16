using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Errands;

public class ErrandsControllerTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    private readonly HttpClient _client;

    public ErrandsControllerTests(SaturdazeApiFactory factory)
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
    public async Task Add_errand_persists_on_weekend_and_regenerate_places_block()
    {
        var d = new DateOnly(2026, 7, 11);
        var created = await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = d.ToString("yyyy-MM-dd") });
        created.EnsureSuccessStatusCode();
        var weekendId = JsonDocument.Parse(await created.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid();

        var add = await _client.PostAsJsonAsync(
            $"/api/weekends/{weekendId}/errands",
            new { Description = "Costco run", EstimatedMinutes = 60 });
        add.EnsureSuccessStatusCode();
        var afterAdd = JsonDocument.Parse(await add.Content.ReadAsStringAsync()).RootElement;
        var errand = afterAdd.GetProperty("errands").EnumerateArray().Single();
        errand.GetProperty("description").GetString().Should().Be("Costco run");
        errand.GetProperty("estimatedMinutes").GetInt32().Should().Be(60);

        var regen = await _client.PostAsync($"/api/weekends/{weekendId}/regenerate", content: null);
        regen.EnsureSuccessStatusCode();
        var regenerated = JsonDocument.Parse(await regen.Content.ReadAsStringAsync()).RootElement;
        regenerated.GetProperty("blocks").EnumerateArray()
            .Should().Contain(b => b.GetProperty("kind").GetString() == "Errand",
                              "regenerate should place the errand into the itinerary");
    }

    [Fact]
    public async Task Mark_done_updates_persisted_flag()
    {
        var d = new DateOnly(2026, 7, 18);
        var created = await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = d.ToString("yyyy-MM-dd") });
        created.EnsureSuccessStatusCode();
        var weekendId = JsonDocument.Parse(await created.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid();

        var add = await _client.PostAsJsonAsync(
            $"/api/weekends/{weekendId}/errands",
            new { Description = "Grocery", EstimatedMinutes = 45 });
        var errandId = JsonDocument.Parse(await add.Content.ReadAsStringAsync()).RootElement
            .GetProperty("errands").EnumerateArray().Single().GetProperty("id").GetGuid();

        var put = await _client.PutAsJsonAsync($"/api/errands/{errandId}/done", new { Done = true });
        put.EnsureSuccessStatusCode();
        var dto = JsonDocument.Parse(await put.Content.ReadAsStringAsync()).RootElement;
        dto.GetProperty("errands").EnumerateArray().Single()
            .GetProperty("done").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task Add_errand_with_invalid_minutes_returns_400()
    {
        var d = new DateOnly(2026, 8, 1);
        var created = await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = d.ToString("yyyy-MM-dd") });
        created.EnsureSuccessStatusCode();
        var weekendId = JsonDocument.Parse(await created.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid();

        var resp = await _client.PostAsJsonAsync(
            $"/api/weekends/{weekendId}/errands",
            new { Description = "X", EstimatedMinutes = 5 });
        resp.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
