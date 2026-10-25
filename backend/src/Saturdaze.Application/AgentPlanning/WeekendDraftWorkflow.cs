using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Planning;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.AgentPlanning;

/// <summary>Everything one draft needs: the family, the planner's inputs for its weekend, and what must never reach a prompt.</summary>
public sealed record DraftContext(
    Guid RunId,
    Family Family,
    PlannerInputs Inputs,
    GeoLocation Home,
    IReadOnlyList<string> ForbiddenTerms);

public enum DraftResult
{
    /// <summary>At least one pick passed the validator.</summary>
    Drafted,

    /// <summary>A control denied the run (L2-205 <c>Policy</c>).</summary>
    Policy,

    /// <summary>No pick passed after the last round (L2-205 <c>Invalid</c>).</summary>
    Invalid
}

public sealed record DraftOutcome(
    DraftResult Result,
    IReadOnlyList<ShortlistItem> Shortlist,
    IReadOnlyList<DraftPick> Picks,
    IReadOnlyList<IReadOnlyList<PickViolation>> Rounds);

/// <summary>
/// The fixed workflow of a draft (L2-202, ADR-023): shared regional research, the gated curator,
/// then the drafter and the deterministic validator for at most <c>MaxCriticRounds</c> revisions.
/// The validator's verdict is final; the agents only propose.
/// </summary>
public sealed class WeekendDraftWorkflow
{
    private readonly IAgentRoleRunner _roles;
    private readonly RegionalResearcher _researcher;
    private readonly AgentControlGate _gate;
    private readonly IWeekendPlanner _planner;
    private readonly PlanValidator _validator;
    private readonly AgentPlanningOptions _options;
    private readonly ILogger<WeekendDraftWorkflow> _logger;

    public WeekendDraftWorkflow(
        IAgentRoleRunner roles, RegionalResearcher researcher, AgentControlGate gate, IWeekendPlanner planner,
        PlanValidator validator, IOptions<AgentPlanningOptions> options, ILogger<WeekendDraftWorkflow> logger)
    {
        _roles = roles;
        _researcher = researcher;
        _gate = gate;
        _planner = planner;
        _validator = validator;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<DraftOutcome> DraftAsync(DraftContext ctx, AgentRunMeter meter, CancellationToken ct)
    {
        var inputs = ctx.Inputs;
        var rounds = new List<IReadOnlyList<PickViolation>>();

        // 1. What is on around the family, shared by the cell. A failure here is not the run's failure.
        try
        {
            await _researcher.EnsureAsync(ctx.Home, inputs.WeekendOf, ctx.RunId, meter, ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning("Regional research failed for run {RunId}: {Error}", ctx.RunId, ex.GetType().Name);
        }

        // 2. The curator, with the family's minimized profile and the read-only tools.
        var profile = FamilyPlanningProfile.Describe(ctx.Family, inputs);
        var curatorInput = AgentPrompts.CuratorInput(profile, inputs.WeekendOf, inputs.Forecast);
        if (!await _gate.CheckInputAsync(AgentRole.Curator, AgentPrompts.CuratorInstructions + curatorInput, ctx.ForbiddenTerms, meter, ct))
            return new DraftOutcome(DraftResult.Policy, Array.Empty<ShortlistItem>(), Array.Empty<DraftPick>(), rounds);

        var toolset = new PlanningToolset(inputs, _gate, meter);
        var curated = await _roles.RunAsync(new AgentRoleRequest(
            AgentRole.Curator, _options.CuratorModel, AgentPrompts.CuratorInstructions, curatorInput, toolset.For(AgentRole.Curator), meter), ct);
        DraftJson.TryParseShortlist(curated.Text, out var shortlist, out var shortlistErrors);
        foreach (var error in shortlistErrors) _gate.RecordOutputViolation(AgentRole.Curator, error, meter);
        var unknown = shortlist.Where(s => CandidateFilter.Find(inputs, s.Id) is null).ToList();
        foreach (var u in unknown) _gate.RecordOutputViolation(AgentRole.Curator, $"shortlisted id {u.Id} is not in the catalog", meter);
        shortlist = shortlist.Except(unknown).ToList();
        if (shortlist.Count == 0)
            return new DraftOutcome(DraftResult.Invalid, shortlist, Array.Empty<DraftPick>(), rounds);

        // 3. The drafter and the validator, round by round.
        var shortlisted = shortlist.Select(s => s.Id).ToHashSet();
        var facts = ShortlistFacts(inputs, shortlist);
        var fixedBlocks = AgentPrompts.FixedBlocks(_planner.Plan(inputs with { Activities = Array.Empty<Activity>(), Events = Array.Empty<LocalEvent>() })
            .Where(b => b.Kind is BlockKind.Commitment or BlockKind.Meal or BlockKind.Drive || b.IsLocked));
        IReadOnlyList<string> feedback = Array.Empty<string>();
        ValidationReport? last = null;
        IReadOnlyList<DraftPick> lastPicks = Array.Empty<DraftPick>();

        for (var round = 1; round <= _options.MaxCriticRounds + 1 && meter.CanCallModel; round++)
        {
            var drafterInput = AgentPrompts.DrafterInput(profile, inputs.WeekendOf, facts, fixedBlocks, feedback, round);
            var instructions = AgentPrompts.DrafterInstructions(inputs.Boundaries.Outings(DayOfWeekend.Saturday), inputs.Boundaries.Outings(DayOfWeekend.Sunday));
            if (!await _gate.CheckInputAsync(AgentRole.Drafter, instructions + drafterInput, ctx.ForbiddenTerms, meter, ct))
                return new DraftOutcome(DraftResult.Policy, shortlist, Array.Empty<DraftPick>(), rounds);

            var drafted = await _roles.RunAsync(new AgentRoleRequest(
                AgentRole.Drafter, _options.DrafterModel, instructions, drafterInput, toolset.For(AgentRole.Drafter), meter), ct);
            DraftJson.TryParsePicks(drafted.Text, out var picks, out var pickErrors);
            foreach (var error in pickErrors) _gate.RecordOutputViolation(AgentRole.Drafter, error, meter);
            foreach (var invented in picks.Where(p => CandidateFilter.Find(inputs, p.Id) is null))
                _gate.RecordOutputViolation(AgentRole.Drafter, $"picked id {invented.Id} is not in the catalog", meter);

            using (var validate = AgentTelemetry.Source.StartActivity("validate_plan"))
            {
                var assembled = _planner.PlanWithPicks(inputs, picks);
                last = _validator.Validate(inputs, shortlisted, picks, assembled);
                validate?.SetTag("saturdaze.round", round);
                validate?.SetTag("saturdaze.violations", last.Violations.Count);
            }
            lastPicks = picks;
            rounds.Add(last.Violations);
            if (last.Clean && picks.Count > 0) break;
            feedback = last.Violations.Select(v => v.ToString()).ToList();
        }

        var passing = last?.Passing ?? Array.Empty<DraftPick>();
        // A plan-level rule broken by the passing picks (a meal pushed out of its window) is the planner's
        // own guarantee; the picks still stand only when the plan they make keeps every rule.
        if (passing.Count > 0 && last!.Violations.Any(v => v.Pick is null))
        {
            var recheck = _validator.Validate(inputs, shortlisted, passing, _planner.PlanWithPicks(inputs, passing));
            passing = recheck.Violations.Any(v => v.Pick is null) ? Array.Empty<DraftPick>() : recheck.Passing;
        }
        return passing.Count > 0
            ? new DraftOutcome(DraftResult.Drafted, shortlist, passing, rounds)
            : new DraftOutcome(DraftResult.Invalid, shortlist, lastPicks, rounds);
    }

    /// <summary>The shortlist as the drafter needs it: each place's timing facts, text quoted as data.</summary>
    private static string ShortlistFacts(PlannerInputs inputs, IEnumerable<ShortlistItem> shortlist)
    {
        var sb = new StringBuilder();
        foreach (var item in shortlist)
        {
            var c = CandidateFilter.Find(inputs, item.Id)!;
            sb.Append($"- {item.Kind.ToString().ToLowerInvariant()} {item.Id}: {AgentPrompts.Data(c.Name)}; ");
            sb.Append(c.Indoor switch { true => "indoor", false => "outdoor", _ => "indoor or outdoor unknown" });
            sb.Append($"; {c.DriveMinutes} min drive");
            if (c.Kind == CandidateKind.Activity) sb.Append($"; about {c.DurationMinutes} min");
            if (c.OpensAt is { } o && c.ClosesAt is { } cl) sb.Append($"; open {o:HH\\:mm}-{cl:HH\\:mm}");
            if (c.Kind == CandidateKind.Event)
            {
                var e = inputs.Events.First(x => x.Id == c.Id);
                sb.Append($"; runs {e.StartsOn:yyyy-MM-dd} to {e.EndsOn:yyyy-MM-dd}");
                if (c.StartTime is { } st && c.EndTime is { } en) sb.Append($", {st:HH\\:mm}-{en:HH\\:mm}");
            }
            sb.AppendLine($"; curator: {AgentPrompts.Data(item.Reason)}");
        }
        if (inputs.Sunsets is { } sunsets)
            sb.AppendLine($"Sunset: Saturday {sunsets.GetValueOrDefault(DayOfWeekend.Saturday):HH\\:mm}, Sunday {sunsets.GetValueOrDefault(DayOfWeekend.Sunday):HH\\:mm}.");
        return sb.ToString();
    }
}
