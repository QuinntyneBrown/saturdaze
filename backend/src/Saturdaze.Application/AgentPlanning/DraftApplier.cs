using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Planning;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.AgentPlanning;

/// <summary>
/// Turns a stored draft into the weekend's blocks (L2-202, L2-204): its picks placed with
/// <see cref="IWeekendPlanner.PlanWithPicks"/> around the weekend's locked blocks, the rest
/// replaced as a regenerate would, <c>RegenerateCount</c> untouched. Deterministic: the same
/// draft and the same weekend give the same blocks.
/// </summary>
public sealed class DraftApplier
{
    private readonly IAppDbContext _db;
    private readonly IWeekendPlanner _planner;
    private readonly PlannerInputLoader _loader;

    public DraftApplier(IAppDbContext db, IWeekendPlanner planner, PlannerInputLoader loader)
    {
        _db = db;
        _planner = planner;
        _loader = loader;
    }

    public async Task ApplyAsync(Weekend weekend, WeekendDraft draft, CancellationToken ct)
    {
        var ctx = await _loader.LoadAsync(weekend.FamilyId, weekend.WeekendOf, ct);
        var locked = weekend.Blocks.Where(b => b.IsLocked).ToList();
        var pendingErrand = weekend.Errands.FirstOrDefault(e => !e.Done);
        var picks = DraftJson.DeserializePicks(draft.PicksJson);
        var planned = _planner.PlanWithPicks(ctx.ToInputs(locked, pendingErrand, weekend.WeekendOf.DayNumber), picks);

        var lockedIds = locked.Select(b => b.Id).ToHashSet();
        foreach (var b in weekend.Blocks.Where(b => !lockedIds.Contains(b.Id)).ToList())
        {
            weekend.Blocks.Remove(b);
            _db.ItineraryBlocks.Remove(b);
        }
        foreach (var b in planned.Where(p => !lockedIds.Contains(p.Id)))
            _db.ItineraryBlocks.Add(WeekendFactory.Copy(b, weekend.Id));

        weekend.PlanSource = PlanSource.Agents;
        weekend.Home = GeoLocation.Merge(weekend.Home, ctx.Home.Copy());
        draft.Applied = true;
        await _db.SaveChangesAsync(ct);
    }
}

/// <summary>Creates a family's weekend that does not exist yet, from the planner or from a stored draft.</summary>
public sealed class WeekendFactory
{
    private readonly IAppDbContext _db;
    private readonly IWeekendPlanner _planner;
    private readonly PlannerInputLoader _loader;

    public WeekendFactory(IAppDbContext db, IWeekendPlanner planner, PlannerInputLoader loader)
    {
        _db = db;
        _planner = planner;
        _loader = loader;
    }

    /// <summary>The weekend for the family and date: the existing one, or a new one planned now.</summary>
    public async Task<(Weekend Weekend, PlannerContext Context)> GetOrCreateAsync(Guid familyId, DateOnly weekendOf, WeekendDraft? draft, CancellationToken ct)
    {
        var existing = await _db.Weekends.Include(w => w.Blocks).Include(w => w.Errands)
            .FirstOrDefaultAsync(w => w.FamilyId == familyId && w.WeekendOf == weekendOf, ct);
        var ctx = await _loader.LoadAsync(familyId, weekendOf, ct);
        if (existing is not null) return (existing, ctx);

        var inputs = ctx.ToInputs(Array.Empty<ItineraryBlock>(), errand: null, seed: weekendOf.DayNumber);
        var picks = draft is null ? Array.Empty<DraftPick>() : (IReadOnlyList<DraftPick>)DraftJson.DeserializePicks(draft.PicksJson);
        var weekend = new Weekend
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            WeekendOf = weekendOf,
            Home = ctx.Home.Copy(),
            PlanSource = draft is null ? PlanSource.Planner : PlanSource.Agents,
        };
        weekend.Blocks = _planner.PlanWithPicks(inputs, picks).Select(b => Copy(b, weekend.Id)).ToList();
        if (draft is not null) draft.Applied = true;
        _db.Weekends.Add(weekend);
        await _db.SaveChangesAsync(ct);
        return (weekend, ctx);
    }

    public static ItineraryBlock Copy(ItineraryBlock b, Guid weekendId) => new()
    {
        Id = b.Id == Guid.Empty ? Guid.NewGuid() : b.Id,
        WeekendId = weekendId,
        Day = b.Day,
        StartTime = b.StartTime,
        EndTime = b.EndTime,
        Kind = b.Kind,
        Title = b.Title,
        RefId = b.RefId,
        IsLocked = b.IsLocked,
        Reason = b.Reason,
        SortOrder = b.SortOrder,
        Stop = b.Stop?.Copy(),
        FromCalendar = b.FromCalendar,
        PickedByAgents = b.PickedByAgents
    };
}

/// <summary>The family-facing notice for a run that fell back (L2-205).</summary>
public static class AgentDraftNotice
{
    public static string? For(AgentFallbackReason? reason) => reason switch
    {
        AgentFallbackReason.Disabled => "Agent planning is off right now, so the planner made this weekend.",
        AgentFallbackReason.Error or AgentFallbackReason.Timeout => "The agents couldn't finish, so the planner made this weekend.",
        AgentFallbackReason.Budget => "Agent planning has reached its limit for now, so the planner made this weekend.",
        AgentFallbackReason.Policy or AgentFallbackReason.Invalid => "None of the agents' picks fit your family's rules, so the planner made this weekend.",
        _ => null
    };
}

/// <summary>A run's cost from its usage at the configured prices (L2-207 AC5).</summary>
public static class AgentCostCalculator
{
    public static decimal Cost(AgentPlanningOptions o, int inputTokens, int outputTokens, int searches) =>
        Math.Round(
            inputTokens * o.PriceInputPerMTokUsd / 1_000_000m
            + outputTokens * o.PriceOutputPerMTokUsd / 1_000_000m
            + searches * o.PricePerThousandSearchesUsd / 1_000m,
            4, MidpointRounding.AwayFromZero);
}
