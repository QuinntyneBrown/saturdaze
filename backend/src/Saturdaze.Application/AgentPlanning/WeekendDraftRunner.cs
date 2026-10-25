using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Planning;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.AgentPlanning;

/// <summary>
/// The lifecycle of an agent draft (L2-203, L2-205, L2-207, L2-208): queue it, run it under the
/// caps and the timeout, store and apply what passed, or fall back and say why. Every run closes
/// with its usage, cost, violations and trace id, and no exception leaves <see cref="RunAsync"/>.
/// The scheduled job and the API's queue processor both call it.
/// </summary>
public sealed class WeekendDraftRunner
{
    private const int ErrorMaxLength = 2000;
    private const int ViolationsMaxLength = 4000;

    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;
    private readonly WeekendDraftWorkflow _workflow;
    private readonly WeekendFactory _weekends;
    private readonly DraftApplier _applier;
    private readonly PlannerInputLoader _loader;
    private readonly IOptionsMonitor<AgentPlanningOptions> _options;
    private readonly ILogger<WeekendDraftRunner> _logger;

    public WeekendDraftRunner(
        IAppDbContext db, IDateTimeProvider clock, WeekendDraftWorkflow workflow, WeekendFactory weekends,
        DraftApplier applier, PlannerInputLoader loader, IOptionsMonitor<AgentPlanningOptions> options, ILogger<WeekendDraftRunner> logger)
    {
        _db = db;
        _clock = clock;
        _workflow = workflow;
        _weekends = weekends;
        _applier = applier;
        _loader = loader;
        _options = options;
        _logger = logger;
    }

    public async Task<AgentRun> QueueAsync(Guid familyId, DateOnly weekendOf, AgentRunTrigger trigger, CancellationToken ct)
    {
        var run = new AgentRun
        {
            Id = Guid.NewGuid(), FamilyId = familyId, WeekendOf = weekendOf, Trigger = trigger,
            Status = AgentRunStatus.Queued, QueuedUtc = _clock.UtcNow,
        };
        _db.AgentRuns.Add(run);
        await _db.SaveChangesAsync(ct);
        return run;
    }

    public async Task<AgentRun> RunAsync(Guid runId, CancellationToken ct)
    {
        var options = _options.CurrentValue;
        var run = await _db.AgentRuns.SingleAsync(r => r.Id == runId, ct);
        if (run.Status != AgentRunStatus.Queued) return run;

        // Count and open under one lock, so concurrent runs take turns against the caps (L2-207).
        AgentFallbackReason? refused = null;
        await using (await _db.AcquireLockAsync("saturdaze-agent-runs", ct))
        {
            if (!options.Enabled) refused = AgentFallbackReason.Disabled;
            else if (await OverBudgetAsync(options, ct)) refused = AgentFallbackReason.Budget;
            run.Status = AgentRunStatus.Running;
            run.StartedUtc = _clock.UtcNow;
            await _db.SaveChangesAsync(ct);
        }

        using var span = AgentTelemetry.Source.StartActivity("plan_weekend");
        span?.SetTag("saturdaze.run.id", run.Id.ToString());
        span?.SetTag("saturdaze.run.trigger", run.Trigger.ToString());
        run.TraceId = span?.TraceId.ToString();

        var meter = new AgentRunMeter(options);
        var rounds = 0;
        try
        {
            if (refused is not null)
            {
                await FallBackAsync(run, refused.Value, ct);
            }
            else
            {
                using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
                timeout.CancelAfter(TimeSpan.FromSeconds(options.RunTimeoutSeconds));
                try
                {
                    rounds = await DraftAndApplyAsync(run, meter, timeout.Token);
                }
                catch (OperationCanceledException) when (!ct.IsCancellationRequested)
                {
                    _db.DiscardChanges();
                    run = await _db.AgentRuns.SingleAsync(r => r.Id == runId, CancellationToken.None);
                    await FallBackAsync(run, AgentFallbackReason.Timeout, CancellationToken.None);
                }
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
        {
            // An outage, a refusal or a bug: the planner's weekend stands (L2-205 AC2). No prompt text is kept.
            _logger.LogWarning("Agent run {RunId} failed: {Error}", runId, ex.GetType().Name);
            _db.DiscardChanges();
            run = await _db.AgentRuns.SingleAsync(r => r.Id == runId, CancellationToken.None);
            run.Error = Truncate($"{ex.GetType().Name}: {ex.Message}", ErrorMaxLength);
            try { await FallBackAsync(run, AgentFallbackReason.Error, CancellationToken.None); }
            catch (Exception inner) { _logger.LogError(inner, "Agent run {RunId} could not fall back cleanly.", runId); }
        }
        finally
        {
            run.Rounds = rounds;
            run.ModelCalls = meter.ModelCalls;
            run.ToolCalls = meter.ToolCalls;
            run.WebSearches = meter.WebSearches;
            run.InputTokens = meter.InputTokens;
            run.OutputTokens = meter.OutputTokens;
            run.CostUsd = AgentCostCalculator.Cost(options, meter.InputTokens, meter.OutputTokens, meter.WebSearches);
            if (meter.Violations.Count > 0) run.PolicyViolations = Truncate(string.Join('\n', meter.Violations), ViolationsMaxLength);
            run.FinishedUtc ??= _clock.UtcNow;
            await _db.SaveChangesAsync(CancellationToken.None);

            span?.SetTag("saturdaze.run.status", run.Status.ToString());
            span?.SetTag("saturdaze.run.fallback_reason", run.FallbackReason?.ToString());
            span?.SetTag("saturdaze.run.cost_usd", (double)run.CostUsd);
        }
        return run;
    }

    /// <returns>The drafter rounds that reached the validator.</returns>
    private async Task<int> DraftAndApplyAsync(AgentRun run, AgentRunMeter meter, CancellationToken ct)
    {
        var family = await _db.Families.AsNoTracking()
            .Include(f => f.Members).Include(f => f.Commitments).Include(f => f.Preferences)
            .SingleAsync(f => f.Id == run.FamilyId, ct);
        var emails = await _db.Users.Where(u => u.FamilyId == run.FamilyId).Select(u => u.Email).ToListAsync(ct);
        var weekend = await _db.Weekends.Include(w => w.Blocks).Include(w => w.Errands)
            .FirstOrDefaultAsync(w => w.FamilyId == run.FamilyId && w.WeekendOf == run.WeekendOf, ct);

        var (ctx, inputs) = await InputsAsync(weekend, run, ct);
        var outcome = await _workflow.DraftAsync(
            new DraftContext(run.Id, family, inputs, ctx.Home, FamilyPlanningProfile.ForbiddenTerms(family, emails)), meter, ct);

        if (outcome.Rounds.Count > 0)
        {
            var draft = new WeekendDraft
            {
                Id = Guid.NewGuid(), AgentRunId = run.Id, FamilyId = run.FamilyId, WeekendOf = run.WeekendOf,
                ShortlistJson = DraftJson.Serialize(outcome.Shortlist),
                PicksJson = DraftJson.Serialize(outcome.Picks),
                ValidatorReport = DraftJson.Serialize(outcome.Rounds.Select((r, i) => new
                {
                    round = i + 1,
                    violations = r.Select(v => new { pickId = v.Pick?.Id, day = v.Pick?.Day.ToString(), rule = v.Rule, detail = v.Detail }),
                })),
                CreatedUtc = _clock.UtcNow,
            };
            _db.WeekendDrafts.Add(draft);
            await _db.SaveChangesAsync(ct);

            if (outcome.Result == DraftResult.Drafted)
            {
                if (weekend is null) await _weekends.GetOrCreateAsync(run.FamilyId, run.WeekendOf, draft, ct);
                else await _applier.ApplyAsync(weekend, draft, ct);
                run.Status = AgentRunStatus.Applied;
                run.FinishedUtc = _clock.UtcNow;
                await _db.SaveChangesAsync(ct);
                return outcome.Rounds.Count;
            }
        }

        await FallBackAsync(run, outcome.Result == DraftResult.Policy ? AgentFallbackReason.Policy : AgentFallbackReason.Invalid, ct);
        return outcome.Rounds.Count;
    }

    private async Task<(PlannerContext Context, PlannerInputs Inputs)> InputsAsync(Weekend? weekend, AgentRun run, CancellationToken ct)
    {
        var ctx = await _loader.LoadAsync(run.FamilyId, run.WeekendOf, ct);
        var locked = weekend?.Blocks.Where(b => b.IsLocked).ToList() ?? new List<ItineraryBlock>();
        var errand = weekend?.Errands.FirstOrDefault(e => !e.Done);
        return (ctx, ctx.ToInputs(locked, errand, run.WeekendOf.DayNumber));
    }

    /// <summary>Leaves the planner's weekend, creating it when a scheduled run finds none (L2-205 AC5).</summary>
    private async Task FallBackAsync(AgentRun run, AgentFallbackReason reason, CancellationToken ct)
    {
        run.Status = AgentRunStatus.FellBack;
        run.FallbackReason = reason;
        run.FinishedUtc = _clock.UtcNow;
        await _db.SaveChangesAsync(ct);
        if (run.Trigger == AgentRunTrigger.Scheduled)
            await _weekends.GetOrCreateAsync(run.FamilyId, run.WeekendOf, draft: null, ct);
    }

    private async Task<bool> OverBudgetAsync(AgentPlanningOptions options, CancellationToken ct)
    {
        var now = _clock.UtcNow;
        var startOfDay = new DateTimeOffset(now.UtcDateTime.Date, TimeSpan.Zero);
        var startOfMonth = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var today = await _db.AgentRuns.CountAsync(r => r.StartedUtc != null && r.StartedUtc >= startOfDay, ct);
        if (today >= options.MaxRunsPerDay) return true;
        var spent = (await _db.AgentRuns.Where(r => r.QueuedUtc >= startOfMonth).Select(r => r.CostUsd).ToListAsync(ct)).Sum();
        return spent >= options.MonthlySpendCapUsd;
    }

    private static string Truncate(string value, int max) => value.Length <= max ? value : value[..max];
}
