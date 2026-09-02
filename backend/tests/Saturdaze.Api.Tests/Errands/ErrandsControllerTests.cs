using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Errands;

public class ErrandsControllerTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private HttpClient _client = null!;

    public ErrandsControllerTests(SaturdazeApiFactory factory)
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
    public async Task Add_errand_persists_on_weekend_and_places_a_block_immediately()
    {
        // Traces to: L2-021 #1, L1-008
        var d = new DateOnly(2026, 7, 11);
        var created = await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = d.ToString("yyyy-MM-dd") });
        created.EnsureSuccessStatusCode();
        var weekendId = JsonDocument.Parse(await created.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid();

        var add = await _client.PostAsJsonAsync(
            $"/api/weekends/{weekendId}/errands",
            new { Description = "Costco run", EstimatedMinutes = 60 });
        var addBody = await add.Content.ReadAsStringAsync();
        add.StatusCode.Should().Be(HttpStatusCode.OK, addBody);
        var afterAdd = JsonDocument.Parse(addBody).RootElement;
        var errand = afterAdd.GetProperty("errands").EnumerateArray().Single();
        errand.GetProperty("description").GetString().Should().Be("Costco run");
        errand.GetProperty("estimatedMinutes").GetInt32().Should().Be(60);
        errand.GetProperty("done").GetBoolean().Should().BeFalse();

        var placed = afterAdd.GetProperty("blocks").EnumerateArray()
            .Single(b => b.GetProperty("kind").GetString() == "Errand");
        placed.GetProperty("title").GetString().Should().Be("Costco run");
        placed.GetProperty("refId").GetGuid().Should().Be(errand.GetProperty("id").GetGuid());
        placed.GetProperty("day").GetString().Should().Be("Saturday", "Saturday is tried first by default");

        // No block on that day may overlap the errand.
        var day = placed.GetProperty("day").GetString();
        var start = TimeOnly.Parse(placed.GetProperty("startTime").GetString()!);
        var end = TimeOnly.Parse(placed.GetProperty("endTime").GetString()!);
        afterAdd.GetProperty("blocks").EnumerateArray()
            .Where(b => b.GetProperty("day").GetString() == day && b.GetProperty("id").GetGuid() != placed.GetProperty("id").GetGuid())
            .Should().OnlyContain(b =>
                TimeOnly.Parse(b.GetProperty("endTime").GetString()!) <= start ||
                TimeOnly.Parse(b.GetProperty("startTime").GetString()!) >= end);

        var regen = await _client.PostAsync($"/api/weekends/{weekendId}/regenerate", content: null);
        regen.EnsureSuccessStatusCode();
        var regenerated = JsonDocument.Parse(await regen.Content.ReadAsStringAsync()).RootElement;
        regenerated.GetProperty("blocks").EnumerateArray()
            .Should().Contain(b => b.GetProperty("kind").GetString() == "Errand",
                              "regenerate keeps the pending errand in the itinerary");
    }

    [Fact]
    public async Task Add_errand_honours_the_preferred_day()
    {
        var d = new DateOnly(2026, 8, 8);
        var created = await _client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = d.ToString("yyyy-MM-dd") });
        created.EnsureSuccessStatusCode();
        var weekendId = JsonDocument.Parse(await created.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid();

        var add = await _client.PostAsJsonAsync(
            $"/api/weekends/{weekendId}/errands",
            new { Description = "Garden centre", EstimatedMinutes = 40, PreferredDay = "Sunday" });
        add.EnsureSuccessStatusCode();
        var placed = JsonDocument.Parse(await add.Content.ReadAsStringAsync()).RootElement
            .GetProperty("blocks").EnumerateArray()
            .Single(b => b.GetProperty("kind").GetString() == "Errand");
        placed.GetProperty("day").GetString().Should().Be("Sunday");
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
    public async Task Mark_done_on_unknown_errand_returns_404()
    {
        var put = await _client.PutAsJsonAsync($"/api/errands/{Guid.NewGuid()}/done", new { Done = true });
        put.StatusCode.Should().Be(HttpStatusCode.NotFound);
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
