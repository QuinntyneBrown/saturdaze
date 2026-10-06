using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Weekends;

/// <summary>L2-095: preview where the planner would fit an idea, then add it.</summary>
public class AddIdeaTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public AddIdeaTests(SaturdazeApiFactory factory)
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

    private sealed record Plan(HttpClient Client, Guid WeekendId, JsonElement Weekend);

    private async Task<Plan> PlanAsync()
    {
        var client = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        var res = await client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = "2026-05-16" });
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var weekend = JsonDocument.Parse(body).RootElement.Clone();
        return new Plan(client, weekend.GetProperty("id").GetGuid(), weekend);
    }

    private static async Task<Guid> ActivityId(HttpClient client, string name)
    {
        var list = JsonDocument.Parse(await client.GetStringAsync("/api/activities")).RootElement;
        return list.EnumerateArray().Single(a => a.GetProperty("name").GetString() == name).GetProperty("id").GetGuid();
    }

    private static object Request(Guid ideaId, string day = "Sunday", string timing = "bestFit", string kind = "activity") =>
        new { IdeaKind = kind, IdeaId = ideaId, Day = day, Timing = timing };

    private static TimeOnly Time(JsonElement e, string name) => TimeOnly.Parse(e.GetProperty(name).GetString()!);

    private static IEnumerable<JsonElement> Blocks(JsonElement weekend, string day) =>
        weekend.GetProperty("blocks").EnumerateArray().Where(b => b.GetProperty("day").GetString() == day);

    [Fact]
    public async Task Preview_proposes_a_slot_that_moves_only_unlocked_planner_blocks()
    {
        // Traces to: L2-095 AC2, L1-004
        var plan = await PlanAsync();
        var idea = await ActivityId(plan.Client, "Mississauga Central Library Family Programs");

        var res = await plan.Client.PostAsJsonAsync($"/api/weekends/{plan.WeekendId}/ideas/preview", Request(idea));
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var preview = JsonDocument.Parse(body).RootElement;

        preview.GetProperty("fits").GetBoolean().Should().BeTrue();
        preview.GetProperty("day").GetString().Should().Be("Sunday");
        var start = Time(preview, "startTime");
        var end = Time(preview, "endTime");
        (end - start).TotalMinutes.Should().Be(60);

        var fixedBlocks = Blocks(plan.Weekend, "Sunday")
            .Where(b => b.GetProperty("isLocked").GetBoolean() || b.GetProperty("kind").GetString() is "Commitment" or "Meal");
        foreach (var b in fixedBlocks)
        {
            var overlaps = Time(b, "startTime") < end && start < Time(b, "endTime");
            overlaps.Should().BeFalse($"{b.GetProperty("title")} is fixed");
        }

        var replaceable = Blocks(plan.Weekend, "Sunday")
            .Where(b => !b.GetProperty("isLocked").GetBoolean() && b.GetProperty("kind").GetString() is "Activity" or "Downtime" or "Drive")
            .Select(b => b.GetProperty("title").GetString())
            .ToList();
        preview.GetProperty("replacedBlockTitles").EnumerateArray().Select(t => t.GetString())
            .Should().OnlyContain(t => replaceable.Contains(t));
    }

    [Fact]
    public async Task Confirming_adds_the_block_at_the_previewed_time_with_a_travel_leg()
    {
        // Traces to: L2-095 AC3
        var plan = await PlanAsync();
        var idea = await ActivityId(plan.Client, "Mississauga Central Library Family Programs");
        var preview = JsonDocument.Parse(await (await plan.Client.PostAsJsonAsync(
            $"/api/weekends/{plan.WeekendId}/ideas/preview", Request(idea))).Content.ReadAsStringAsync()).RootElement;
        var replaced = preview.GetProperty("replacedBlockTitles").EnumerateArray().Select(t => t.GetString()).ToList();

        var res = await plan.Client.PostAsJsonAsync($"/api/weekends/{plan.WeekendId}/ideas", Request(idea));
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var weekend = JsonDocument.Parse(body).RootElement;

        var added = Blocks(weekend, "Sunday").Single(b =>
            b.GetProperty("kind").GetString() == "Activity" && b.GetProperty("refId").GetString() == idea.ToString());
        added.GetProperty("startTime").GetString().Should().Be(preview.GetProperty("startTime").GetString());
        added.GetProperty("endTime").GetString().Should().Be(preview.GetProperty("endTime").GetString());
        added.GetProperty("isLocked").GetBoolean().Should().BeFalse();
        added.GetProperty("stopNumber").ValueKind.Should().Be(JsonValueKind.Number);
        added.GetProperty("legBefore").ValueKind.Should().Be(JsonValueKind.Object);

        int Count(JsonElement w, string? title) => Blocks(w, "Sunday").Count(b => b.GetProperty("title").GetString() == title);
        foreach (var gone in replaced.Distinct())
            Count(weekend, gone).Should().BeLessThan(Count(plan.Weekend, gone), $"{gone} was replaced");

        var reloaded = JsonDocument.Parse(await plan.Client.GetStringAsync($"/api/weekends/{plan.WeekendId}")).RootElement;
        Blocks(reloaded, "Sunday").Should().Contain(b => b.GetProperty("refId").GetString() == idea.ToString());
    }

    [Fact]
    public async Task A_day_with_no_room_around_its_locked_blocks_does_not_fit()
    {
        // Traces to: L2-095 AC4
        var plan = await PlanAsync();
        var lockRes = await plan.Client.PutAsJsonAsync($"/api/weekends/{plan.WeekendId}/days/sunday/lock", new { Locked = true });
        lockRes.EnsureSuccessStatusCode();
        var idea = await ActivityId(plan.Client, "Toronto Zoo");

        var preview = JsonDocument.Parse(await (await plan.Client.PostAsJsonAsync(
            $"/api/weekends/{plan.WeekendId}/ideas/preview", Request(idea))).Content.ReadAsStringAsync()).RootElement;
        preview.GetProperty("fits").GetBoolean().Should().BeFalse();
        preview.GetProperty("reason").GetString().Should().NotBeNullOrWhiteSpace();

        var add = await plan.Client.PostAsJsonAsync($"/api/weekends/{plan.WeekendId}/ideas", Request(idea));
        add.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Ideas_outside_the_catalog_and_other_families_pending_submissions_are_not_found()
    {
        // Traces to: L2-095 AC5
        var plan = await PlanAsync();
        var unknown = await plan.Client.PostAsJsonAsync(
            $"/api/weekends/{plan.WeekendId}/ideas/preview", Request(Guid.NewGuid()));
        unknown.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var other = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        var submitted = await other.PostAsJsonAsync("/api/events/submissions",
            new { Title = $"Fair-{Guid.NewGuid():N}", StartsAtLocal = new DateTime(2026, 5, 17, 10, 0, 0) });
        submitted.EnsureSuccessStatusCode();
        var pendingId = JsonDocument.Parse(await submitted.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid();

        var pending = await plan.Client.PostAsJsonAsync(
            $"/api/weekends/{plan.WeekendId}/ideas", Request(pendingId, kind: "event"));
        pending.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Another_familys_weekend_is_not_found()
    {
        // Traces to: L2-095, family scoping
        var plan = await PlanAsync();
        var idea = await ActivityId(plan.Client, "Square One Skating Rink");
        var stranger = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;

        var res = await stranger.PostAsJsonAsync($"/api/weekends/{plan.WeekendId}/ideas/preview", Request(idea));
        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
