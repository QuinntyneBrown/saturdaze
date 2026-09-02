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
public class WeekendFlowTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private HttpClient _client = null!;
    private static readonly DateOnly TestSaturday = new(2026, 5, 16);

    public WeekendFlowTests(SaturdazeApiFactory factory)
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

        // 3. Swap a different (unlocked) activity block. Whether or not the
        //    planner finds an alternative, the call is 200 and the locked block survives.
        var swapCandidate = locked.GetProperty("blocks").EnumerateArray()
            .First(b => b.GetProperty("kind").GetString() == "Activity"
                     && b.GetProperty("id").GetGuid() != lockedBlockId
                     && !b.GetProperty("isLocked").GetBoolean());
        var swapId = swapCandidate.GetProperty("id").GetGuid();
        var swapResp = await _client.PostAsJsonAsync($"/api/blocks/{swapId}/swap",
            new SwapBody(Array.Empty<Guid>()));
        swapResp.StatusCode.Should().Be(HttpStatusCode.OK, await swapResp.Content.ReadAsStringAsync());
        var swapped = await ReadAsync(swapResp);
        swapped.GetProperty("blocks").EnumerateArray()
            .Should().Contain(b => b.GetProperty("id").GetGuid() == lockedBlockId,
                              "locked block must survive a swap on a different block");
        swapped.GetProperty("errands").ValueKind.Should().Be(JsonValueKind.Array,
            "swap responses carry the full weekend, errands included");

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
    public async Task Swap_is_a_no_op_with_a_reason_when_no_alternatives_remain()
    {
        // Traces to: L2-015 #3
        var planResp = await _client.PostAsJsonAsync("/api/weekends/plan",
            new { WeekendOf = TestSaturday.AddDays(7).ToString("yyyy-MM-dd") });
        planResp.EnsureSuccessStatusCode();
        var planned = await ReadAsync(planResp);

        var activity = planned.GetProperty("blocks").EnumerateArray()
            .First(b => b.GetProperty("kind").GetString() == "Activity");
        var blockId = activity.GetProperty("id").GetGuid();
        var refId = activity.GetProperty("refId").GetGuid();

        // Reject every activity in the catalog so the planner has nothing to pick.
        var allActivities = await _client.GetFromJsonAsync<List<ActivitySummary>>("/api/activities?take=200");
        var rejected = allActivities!.Select(a => a.Id).ToArray();

        var swap = await _client.PostAsJsonAsync($"/api/blocks/{blockId}/swap", new SwapBody(rejected));
        swap.StatusCode.Should().Be(HttpStatusCode.OK, await swap.Content.ReadAsStringAsync());
        var block = (await ReadAsync(swap)).GetProperty("blocks").EnumerateArray()
            .Single(b => b.GetProperty("id").GetGuid() == blockId);
        block.GetProperty("refId").GetGuid().Should().Be(refId);
        block.GetProperty("reason").GetString().Should().Contain("no alternative");
    }

    [Fact]
    public async Task Swap_on_a_locked_block_returns_409_block_locked()
    {
        // Traces to: L2-015 #2
        var planResp = await _client.PostAsJsonAsync("/api/weekends/plan",
            new { WeekendOf = TestSaturday.AddDays(14).ToString("yyyy-MM-dd") });
        planResp.EnsureSuccessStatusCode();
        var planned = await ReadAsync(planResp);
        var blockId = planned.GetProperty("blocks").EnumerateArray()
            .First(b => b.GetProperty("kind").GetString() == "Activity")
            .GetProperty("id").GetGuid();

        (await _client.PutAsJsonAsync($"/api/blocks/{blockId}/lock", new { Locked = true })).EnsureSuccessStatusCode();

        var swap = await _client.PostAsJsonAsync($"/api/blocks/{blockId}/swap", new SwapBody(Array.Empty<Guid>()));
        swap.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await ReadAsync(swap)).GetProperty("code").GetString().Should().Be("block_locked");
    }

    private static async Task<JsonElement> ReadAsync(HttpResponseMessage resp)
        => JsonDocument.Parse(await resp.Content.ReadAsStringAsync()).RootElement;

    private sealed record SwapBody(Guid[] RejectedActivityIds);
    private sealed record ActivitySummary(Guid Id);
}
