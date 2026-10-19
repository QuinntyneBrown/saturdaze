// Acceptance Test
// Traces to: L2-084 AC4
// Description: Repeat and Remix keep the current weekend's locked blocks.

using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Weekends;

public class ReuseKeepsLocksTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public ReuseKeepsLocksTests(SaturdazeApiFactory factory)
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

    [Theory]
    [InlineData("repeat")]
    [InlineData("remix")]
    public async Task Reusing_a_saved_weekend_keeps_the_current_weekends_locked_blocks(string action)
    {
        var client = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        var source = await Read(await client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = "2026-05-09" }));
        var current = await Read(await client.GetAsync("/api/weekends/current"));
        var kept = current.GetProperty("blocks").EnumerateArray()
            .First(b => b.GetProperty("kind").GetString() == "Activity");
        var keptId = kept.GetProperty("id").GetGuid();
        (await client.PutAsJsonAsync($"/api/blocks/{keptId}/lock", new { Locked = true })).EnsureSuccessStatusCode();

        var reused = await Read(await client.PostAsync(
            $"/api/weekends/{source.GetProperty("id").GetGuid()}/{action}", content: null));

        var blocks = reused.GetProperty("blocks").EnumerateArray().ToList();
        var survivor = blocks.Single(b => b.GetProperty("id").GetGuid() == keptId);
        survivor.GetProperty("isLocked").GetBoolean().Should().BeTrue();
        survivor.GetProperty("title").GetString().Should().Be(kept.GetProperty("title").GetString());
        survivor.GetProperty("day").GetString().Should().Be(kept.GetProperty("day").GetString());
        survivor.GetProperty("startTime").GetString().Should().Be(kept.GetProperty("startTime").GetString());
        survivor.GetProperty("endTime").GetString().Should().Be(kept.GetProperty("endTime").GetString());

        var start = TimeOnly.Parse(survivor.GetProperty("startTime").GetString()!);
        var end = TimeOnly.Parse(survivor.GetProperty("endTime").GetString()!);
        blocks.Where(b => b.GetProperty("id").GetGuid() != keptId
                && b.GetProperty("day").GetString() == survivor.GetProperty("day").GetString())
            .Should().NotContain(b => TimeOnly.Parse(b.GetProperty("startTime").GetString()!) < end
                && TimeOnly.Parse(b.GetProperty("endTime").GetString()!) > start);
    }

    private static async Task<JsonElement> Read(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();
        response.IsSuccessStatusCode.Should().BeTrue(body);
        return JsonDocument.Parse(body).RootElement.Clone();
    }
}
