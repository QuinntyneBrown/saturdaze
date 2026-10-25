// Acceptance Test
// Traces to: L2-203 AC6, L2-205 AC5, L2-207 AC1-AC5, L2-209 AC5
// Description: Friday's scheduled drafts, the run and spend caps, and regional research shared by a cell.

using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.AgentPlanning;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.AgentPlanning;

public class ScheduledDraftsAndBudgetsTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;

    public ScheduledDraftsAndBudgetsTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        // Wednesday 28 Oct: the upcoming weekend is 31 Oct.
        _factory.Clock.Today = new DateOnly(2026, 10, 28);
        _factory.Agent.Reset();
        _factory.WebSearch.Reset();
        _factory.Agent.Answer = turn => turn.Role == "curator" ? """{"shortlist":[]}""" : """{"picks":[]}""";
    }

    public async Task InitializeAsync()
    {
        using var scope = _factory.Services.CreateScope();
        await EvaluationCatalog.SeedAsync(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<T> InScope<T>(Func<IServiceProvider, Task<T>> work)
    {
        using var scope = _factory.Services.CreateScope();
        return await work(scope.ServiceProvider);
    }

    private T Db<T>(Func<AppDbContext, T> read)
    {
        using var scope = _factory.Services.CreateScope();
        return read(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    private async Task<AgentRun> DraftNowAsync(Guid familyId, DateOnly weekendOf) =>
        await InScope(async sp =>
        {
            var runner = sp.GetRequiredService<WeekendDraftRunner>();
            var run = await runner.QueueAsync(familyId, weekendOf, AgentRunTrigger.Scheduled, default);
            return await runner.RunAsync(run.Id, default);
        });

    [Fact]
    public async Task The_friday_job_drafts_every_family_with_the_preview_on_and_no_other()
    {
        // Traces to: L2-203 AC6
        var on1 = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var on2 = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var off = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        await FamilyProfiles.SaveAsync(off.Client, new { FridayPreviewEnabled = false });

        var runs = await InScope(sp => sp.GetRequiredService<ScheduledDrafts>().RunAsync(default));

        runs.Should().Contain(r => r.FamilyId == on1.FamilyId && r.Trigger == AgentRunTrigger.Scheduled && r.WeekendOf == new DateOnly(2026, 10, 31));
        runs.Should().Contain(r => r.FamilyId == on2.FamilyId && r.Trigger == AgentRunTrigger.Scheduled);
        runs.Should().NotContain(r => r.FamilyId == off.FamilyId);
        Db(db => db.AgentRuns.Count(r => r.FamilyId == off.FamilyId)).Should().Be(0);
    }

    [Fact]
    public async Task A_failing_scheduled_draft_still_leaves_the_family_a_planned_weekend()
    {
        // Traces to: L2-205 AC5
        var persona = await Persona.CreateAsync(_factory);
        _factory.Agent.Fail = new HttpRequestException("Foundry is down");

        var run = await DraftNowAsync(persona.FamilyId, new DateOnly(2026, 11, 21));

        run.FallbackReason.Should().Be(AgentFallbackReason.Error);
        var weekend = await Plans.PlanAsync(persona.Session.Client, "2026-11-21");
        weekend.GetProperty("planSource").GetString().Should().Be("Planner");
        Plans.Blocks(weekend).Should().NotBeEmpty();
        weekend.GetProperty("agentDraft").GetProperty("notice").GetString()
            .Should().Be("The agents couldn't finish, so the planner made this weekend.");
    }

    [Fact]
    public async Task Two_families_in_one_cell_share_one_regional_research()
    {
        // Traces to: L2-207 AC1
        _factory.Geocoder.Add("100 City Centre Dr, Mississauga", 43.5930m, -79.6440m);
        _factory.Geocoder.Add(Persona.Home, 43.5711m, -79.6024m);
        var first = await FamilyProfiles.CreateAsync(_factory, new { HomeLocation = Persona.Home });
        var second = await FamilyProfiles.CreateAsync(_factory, new { HomeLocation = "100 City Centre Dr, Mississauga" });
        _factory.WebSearch.RawText = "[]";

        var a = await DraftNowAsync(first.FamilyId!.Value, new DateOnly(2026, 12, 5));
        var b = await DraftNowAsync(second.FamilyId!.Value, new DateOnly(2026, 12, 5));

        Db(db => db.RegionResearch.Count(r => r.WeekendOf == new DateOnly(2026, 12, 5))).Should().Be(1);
        a.WebSearches.Should().BeGreaterThan(0);
        b.WebSearches.Should().Be(0);
        _factory.WebSearch.Requests.Should().ContainSingle()
            .Which.System.Should().NotContain("Hurontario").And.NotContain("City Centre").And.Contain("43.5");
    }

    private async Task AddRunsAsync(int count, decimal cost)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        for (var i = 0; i < count; i++)
            db.AgentRuns.Add(new AgentRun
            {
                Id = Guid.NewGuid(), FamilyId = Guid.NewGuid(), WeekendOf = new DateOnly(2026, 10, 31),
                Trigger = AgentRunTrigger.Scheduled, Status = AgentRunStatus.Applied,
                QueuedUtc = _factory.Clock.UtcNow, StartedUtc = _factory.Clock.UtcNow, FinishedUtc = _factory.Clock.UtcNow, CostUsd = cost,
            });
        await db.SaveChangesAsync();
    }

    private async Task RemoveRunsAsync(Func<AgentRun, bool> which)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.AgentRuns.RemoveRange(db.AgentRuns.AsEnumerable().Where(which).ToList());
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task Past_the_daily_run_cap_a_draft_falls_back_without_calling_the_model()
    {
        // Traces to: L2-207 AC2
        var persona = await Persona.CreateAsync(_factory);
        var today = Db(db => db.AgentRuns.AsEnumerable().Count(r => r.StartedUtc >= new DateTimeOffset(_factory.Clock.Today.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero)));
        await AddRunsAsync(Math.Max(0, 60 - today), 0m);
        try
        {
            var run = await DraftNowAsync(persona.FamilyId, new DateOnly(2026, 11, 28));

            run.FallbackReason.Should().Be(AgentFallbackReason.Budget);
            run.ModelCalls.Should().Be(0);
            _factory.Agent.Calls.Should().Be(0);
        }
        finally
        {
            await RemoveRunsAsync(r => r.FamilyId != persona.FamilyId && r.CostUsd == 0m && r.Status == AgentRunStatus.Applied && r.ModelCalls == 0);
        }
    }

    [Fact]
    public async Task Past_the_monthly_spend_cap_a_draft_falls_back_without_calling_the_model()
    {
        // Traces to: L2-207 AC3
        var persona = await Persona.CreateAsync(_factory);
        await AddRunsAsync(1, 25m);
        try
        {
            var run = await DraftNowAsync(persona.FamilyId, new DateOnly(2026, 12, 12));

            run.FallbackReason.Should().Be(AgentFallbackReason.Budget);
            _factory.Agent.Calls.Should().Be(0);
        }
        finally
        {
            await RemoveRunsAsync(r => r.CostUsd == 25m);
        }
    }

    [Fact]
    public async Task A_run_never_makes_more_model_calls_than_its_cap()
    {
        // Traces to: L2-207 AC4
        var persona = await Persona.CreateAsync(_factory);
        _factory.Agent.EndlessTool = "search_catalog";

        var run = await DraftNowAsync(persona.FamilyId, new DateOnly(2026, 12, 19));

        run.ModelCalls.Should().BeLessThanOrEqualTo(12).And.BeGreaterThan(0);
        _factory.Agent.Calls.Should().BeLessThanOrEqualTo(12);
    }

    [Fact]
    public async Task A_runs_cost_is_its_usage_at_the_configured_prices()
    {
        // Traces to: L2-207 AC5
        var persona = await Persona.CreateAsync(_factory);

        var run = await DraftNowAsync(persona.FamilyId, new DateOnly(2027, 1, 9));

        var expected = Math.Round(run.InputTokens * 2m / 1_000_000m + run.OutputTokens * 10m / 1_000_000m + run.WebSearches * 10m / 1_000m, 4);
        run.CostUsd.Should().Be(expected);
        run.InputTokens.Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task A_research_row_that_cites_a_page_the_search_did_not_return_is_rejected()
    {
        // Traces to: L2-209 AC5
        _factory.Geocoder.Add("1 Remote Rd, Sudbury", 46.49m, -80.99m);
        var family = await FamilyProfiles.CreateAsync(_factory, new { HomeLocation = "1 Remote Rd, Sudbury" });
        _factory.WebSearch.SearchResultUrls = new() { "https://verified.example.com/market" };
        _factory.WebSearch.RawText = JsonSerializer.Serialize(new object[]
        {
            new { name = "Verified Market", startsOn = "2027-01-16", endsOn = "2027-01-16", location = "Sudbury", driveMinutes = 10, url = "https://verified.example.com/market", category = "Market" },
            new { name = "Invented Fair", startsOn = "2027-01-16", endsOn = "2027-01-16", location = "Sudbury", driveMinutes = 10, url = "https://made-up.example.com/fair", category = "Fair" },
        });

        var run = await DraftNowAsync(family.FamilyId!.Value, new DateOnly(2027, 1, 16));

        Db(db => db.LocalEvents.Any(e => e.Name == "Verified Market")).Should().BeTrue();
        Db(db => db.LocalEvents.Any(e => e.Name == "Invented Fair")).Should().BeFalse();
        Db(db => db.AgentRuns.Single(r => r.Id == run.Id).PolicyViolations).Should().Contain("Invented Fair");
    }
}
