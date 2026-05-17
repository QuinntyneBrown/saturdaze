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

    [Fact]
    public async Task Day_lock_and_regenerate_preserves_other_day()
    {
        var saturday = new DateOnly(2026, 6, 13);
        var plan = await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = saturday.ToString("yyyy-MM-dd") });
        plan.EnsureSuccessStatusCode();
        var planned = JsonDocument.Parse(await plan.Content.ReadAsStringAsync()).RootElement;
        var weekendId = planned.GetProperty("id").GetGuid();
        var sundayIds = planned.GetProperty("blocks").EnumerateArray()
            .Where(b => b.GetProperty("day").GetString() == "Sunday")
            .Select(b => b.GetProperty("id").GetGuid())
            .ToArray();

        var locked = await _client.PutAsJsonAsync(
            $"/api/weekends/{weekendId}/days/saturday/lock",
            new { Locked = true });
        locked.EnsureSuccessStatusCode();
        var lockedBody = JsonDocument.Parse(await locked.Content.ReadAsStringAsync()).RootElement;
        lockedBody.GetProperty("blocks").EnumerateArray()
            .Where(b => b.GetProperty("day").GetString() == "Saturday")
            .Should().OnlyContain(b => b.GetProperty("isLocked").GetBoolean());

        var regenerated = await _client.PostAsync(
            $"/api/weekends/{weekendId}/days/saturday/regenerate",
            content: null);
        regenerated.EnsureSuccessStatusCode();
        var regeneratedBody = JsonDocument.Parse(await regenerated.Content.ReadAsStringAsync()).RootElement;
        regeneratedBody.GetProperty("blocks").EnumerateArray()
            .Where(b => b.GetProperty("day").GetString() == "Sunday")
            .Select(b => b.GetProperty("id").GetGuid())
            .Should().BeEquivalentTo(sundayIds);
    }

    [Fact]
    public async Task Share_and_calendar_endpoints_return_public_artifacts()
    {
        var saturday = new DateOnly(2026, 6, 20);
        var plan = await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = saturday.ToString("yyyy-MM-dd") });
        plan.EnsureSuccessStatusCode();
        var weekendId = JsonDocument.Parse(await plan.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid();

        var share = await _client.PostAsync($"/api/weekends/{weekendId}/share", content: null);
        share.EnsureSuccessStatusCode();
        var shareBody = JsonDocument.Parse(await share.Content.ReadAsStringAsync()).RootElement;
        shareBody.GetProperty("shareUrl").GetString().Should().Contain("/sample-weekend?share=");

        var shared = await _client.GetAsync($"/api/weekends/shared/{shareBody.GetProperty("token").GetString()}");
        shared.EnsureSuccessStatusCode();
        JsonDocument.Parse(await shared.Content.ReadAsStringAsync()).RootElement
            .GetProperty("id").GetGuid().Should().Be(weekendId);

        var calendar = await _client.GetAsync($"/api/weekends/{weekendId}/calendar.ics");
        calendar.EnsureSuccessStatusCode();
        var ics = await calendar.Content.ReadAsStringAsync();
        ics.Should().Contain("BEGIN:VCALENDAR").And.Contain("BEGIN:VEVENT");
    }

    [Fact]
    public async Task Repeat_saved_weekend_replaces_current_plan_without_mutating_source()
    {
        var sourceDate = new DateOnly(2026, 6, 27);
        var sourceResp = await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = sourceDate.ToString("yyyy-MM-dd") });
        sourceResp.EnsureSuccessStatusCode();
        var source = JsonDocument.Parse(await sourceResp.Content.ReadAsStringAsync()).RootElement;
        var sourceId = source.GetProperty("id").GetGuid();
        var sourceTitles = source.GetProperty("blocks").EnumerateArray()
            .Select(b => b.GetProperty("title").GetString())
            .ToArray();

        _factory.Clock.Today = new DateOnly(2026, 7, 4);
        var repeat = await _client.PostAsync($"/api/weekends/{sourceId}/repeat", content: null);
        repeat.EnsureSuccessStatusCode();
        var repeated = JsonDocument.Parse(await repeat.Content.ReadAsStringAsync()).RootElement;

        repeated.GetProperty("weekendOf").GetString().Should().Be("2026-07-04");
        repeated.GetProperty("blocks").EnumerateArray()
            .Select(b => b.GetProperty("title").GetString())
            .Should().BeEquivalentTo(sourceTitles);

        var sourceReload = await _client.GetAsync($"/api/weekends/{sourceId}");
        sourceReload.EnsureSuccessStatusCode();
        JsonDocument.Parse(await sourceReload.Content.ReadAsStringAsync()).RootElement
            .GetProperty("weekendOf").GetString().Should().Be("2026-06-27");
    }
}
