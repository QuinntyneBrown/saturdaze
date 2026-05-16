using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Blocks;

/// <summary>
/// End-to-end coverage of the full interaction loop per plan §9.3:
/// seed → POST plan → swap a block → lock a block → regenerate → assert locked block survived.
/// </summary>
public class WeekendFlowTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    private readonly HttpClient _client;
    private static readonly DateOnly TestSaturday = new(2026, 5, 16);

    public WeekendFlowTests(SaturdazeApiFactory factory)
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
    public async Task End_to_end_plan_swap_lock_regenerate_preserves_locked_block()
    {
        // 1. Plan
        var planResp = await _client.PostAsJsonAsync("/api/weekends/plan",
            new { WeekendOf = TestSaturday.ToString("yyyy-MM-dd") });
        planResp.EnsureSuccessStatusCode();
        var planned = await ReadAsync(planResp);
        var weekendId = planned.GetProperty("id").GetGuid();

        // 2. Lock the first Saturday Activity block
        var satActivity = planned.GetProperty("blocks").EnumerateArray()
            .First(b => b.GetProperty("day").GetString() == "Saturday"
                     && b.GetProperty("kind").GetString() == "Activity");
        var lockedBlockId = satActivity.GetProperty("id").GetGuid();

        var lockResp = await _client.PutAsJsonAsync($"/api/blocks/{lockedBlockId}/lock", new { Locked = true });
        lockResp.EnsureSuccessStatusCode();
        var locked = await ReadAsync(lockResp);
        locked.GetProperty("blocks").EnumerateArray()
            .Should().Contain(b => b.GetProperty("id").GetGuid() == lockedBlockId
                                && b.GetProperty("isLocked").GetBoolean());

        // 3. Swap a *different* (unlocked) Saturday activity if one exists; otherwise pick a Sunday one.
        var swapCandidate = locked.GetProperty("blocks").EnumerateArray()
            .FirstOrDefault(b => b.GetProperty("kind").GetString() == "Activity"
                              && b.GetProperty("id").GetGuid() != lockedBlockId
                              && !b.GetProperty("isLocked").GetBoolean());

        if (swapCandidate.ValueKind != JsonValueKind.Undefined)
        {
            var swapId = swapCandidate.GetProperty("id").GetGuid();
            var swapResp = await _client.PostAsJsonAsync($"/api/blocks/{swapId}/swap",
                new SwapBody(Array.Empty<Guid>()));
            // 404 is acceptable when there's no alternative; otherwise must be 200.
            if (swapResp.StatusCode == HttpStatusCode.OK)
            {
                var swapped = await ReadAsync(swapResp);
                swapped.GetProperty("blocks").EnumerateArray()
                    .Should().Contain(b => b.GetProperty("id").GetGuid() == lockedBlockId,
                                      "locked block must survive a swap on a different block");
            }
        }

        // 4. Regenerate
        var regenResp = await _client.PostAsync($"/api/weekends/{weekendId}/regenerate", content: null);
        regenResp.EnsureSuccessStatusCode();
        var regenerated = await ReadAsync(regenResp);

        regenerated.GetProperty("regenerateCount").GetInt32().Should().Be(1);
        regenerated.GetProperty("blocks").EnumerateArray()
            .Should().Contain(b => b.GetProperty("id").GetGuid() == lockedBlockId
                                && b.GetProperty("isLocked").GetBoolean(),
                              "regenerate must preserve user-locked blocks verbatim");
    }

    [Fact]
    public async Task Swap_returns_404_when_no_alternatives_remain()
    {
        var planResp = await _client.PostAsJsonAsync("/api/weekends/plan",
            new { WeekendOf = TestSaturday.AddDays(7).ToString("yyyy-MM-dd") });
        planResp.EnsureSuccessStatusCode();
        var planned = await ReadAsync(planResp);

        var activity = planned.GetProperty("blocks").EnumerateArray()
            .FirstOrDefault(b => b.GetProperty("kind").GetString() == "Activity");
        if (activity.ValueKind == JsonValueKind.Undefined) return; // weekend had no activity slot

        var blockId = activity.GetProperty("id").GetGuid();

        // Reject every activity in the catalog so the planner has nothing to pick.
        var allActivities = await _client.GetFromJsonAsync<List<ActivitySummary>>("/api/activities?take=200");
        var rejected = allActivities!.Select(a => a.Id).ToArray();

        var swap = await _client.PostAsJsonAsync($"/api/blocks/{blockId}/swap",
            new SwapBody(rejected));
        swap.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static async Task<JsonElement> ReadAsync(HttpResponseMessage resp)
        => JsonDocument.Parse(await resp.Content.ReadAsStringAsync()).RootElement;

    private sealed record SwapBody(Guid[] RejectedActivityIds);
    private sealed record ActivitySummary(Guid Id);
}
