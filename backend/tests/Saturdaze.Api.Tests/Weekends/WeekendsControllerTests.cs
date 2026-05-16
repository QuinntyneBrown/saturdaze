using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Weekends;

public class WeekendsControllerTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    private readonly HttpClient _client;
    private static readonly DateOnly TestSaturday = new(2026, 5, 16);

    public WeekendsControllerTests(SaturdazeApiFactory factory)
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
    public async Task Plan_creates_weekend_with_blocks_for_sat_and_sun()
    {
        var response = await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = TestSaturday.ToString("yyyy-MM-dd") });
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);

        var weekend = JsonDocument.Parse(body).RootElement;
        weekend.GetProperty("weekendOf").GetString().Should().Be("2026-05-16");
        var blocks = weekend.GetProperty("blocks").EnumerateArray().ToArray();
        blocks.Should().NotBeEmpty();
        blocks.Select(b => b.GetProperty("day").GetString()).Distinct()
            .Should().BeEquivalentTo("Saturday", "Sunday");
    }

    [Fact]
    public async Task Plan_is_idempotent_per_family_and_date()
    {
        var first = await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = TestSaturday.ToString("yyyy-MM-dd") });
        first.EnsureSuccessStatusCode();
        var firstId = JsonDocument.Parse(await first.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetString();

        var second = await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = TestSaturday.ToString("yyyy-MM-dd") });
        second.EnsureSuccessStatusCode();
        var secondId = JsonDocument.Parse(await second.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetString();

        secondId.Should().Be(firstId);
    }

    [Fact]
    public async Task GetById_returns_404_for_unknown_weekend()
    {
        var response = await _client.GetAsync($"/api/weekends/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetById_returns_existing_weekend()
    {
        var created = await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = TestSaturday.ToString("yyyy-MM-dd") });
        created.EnsureSuccessStatusCode();
        var id = JsonDocument.Parse(await created.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetString();

        var response = await _client.GetAsync($"/api/weekends/{id}");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Plan_with_non_saturday_returns_400()
    {
        // 2026-05-15 is a Friday.
        var response = await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = "2026-05-15" });
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, body);
    }

    [Fact]
    public async Task Current_auto_plans_when_no_weekend_exists_for_upcoming_saturday()
    {
        // The factory pins the clock to TestSaturday (2026-05-16). With no
        // weekend pre-planned for the family, GET /current must materialise
        // one on demand and return 200 — never 404.
        _factory.Clock.Today = TestSaturday;

        var response = await _client.GetAsync("/api/weekends/current");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);

        var weekend = JsonDocument.Parse(body).RootElement;
        weekend.GetProperty("weekendOf").GetString().Should().Be("2026-05-16");
        weekend.GetProperty("blocks").EnumerateArray().Should().NotBeEmpty();
    }

    [Fact]
    public async Task Current_returns_existing_weekend_when_already_planned()
    {
        _factory.Clock.Today = TestSaturday;

        var plan = await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = TestSaturday.ToString("yyyy-MM-dd") });
        plan.EnsureSuccessStatusCode();
        var plannedId = JsonDocument.Parse(await plan.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetString();

        var current = await _client.GetAsync("/api/weekends/current");
        current.EnsureSuccessStatusCode();
        var currentId = JsonDocument.Parse(await current.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetString();

        currentId.Should().Be(plannedId);
    }
}
