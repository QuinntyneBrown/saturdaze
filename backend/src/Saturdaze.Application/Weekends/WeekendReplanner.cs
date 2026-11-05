using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Planning;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Weekends;

/// <summary>
/// Re-plans a loaded weekend: every locked block stays in place by ID and
/// content, commitments included (L2-011 AC2, L2-016 AC1), and everything
/// else is planned again. Shared by the family's regenerate and the
/// administrator's sample weekend (L2-160). Saves; callers map the result.
/// </summary>
public sealed class WeekendReplanner
{
    private readonly IAppDbContext _db;
    private readonly IWeekendPlanner _planner;
    private readonly PlannerInputLoader _loader;

    public WeekendReplanner(IAppDbContext db, IWeekendPlanner planner, PlannerInputLoader loader)
    {
        _db = db;
        _planner = planner;
        _loader = loader;
    }

    /// <summary>Returns the planner context so the caller can map with its forecast.</summary>
    public async Task<PlannerContext> RegenerateAsync(Weekend weekend, Guid familyId, CancellationToken ct)
    {
        var lockedBlocks = weekend.Blocks.Where(b => b.IsLocked).ToList();

        var ctx = await _loader.LoadAsync(familyId, weekend.WeekendOf, ct);

        weekend.RegenerateCount++;
        weekend.PlanSource = Domain.Enums.PlanSource.Planner;
        var seed = weekend.WeekendOf.DayNumber + weekend.RegenerateCount * 31;

        var pendingErrand = weekend.Errands.FirstOrDefault(e => !e.Done);
        var planned = _planner.Plan(ctx.ToInputs(lockedBlocks, pendingErrand, seed));

        // Remove all non-locked blocks; keep locked.
        var lockedIds = lockedBlocks.Select(b => b.Id).ToHashSet();
        foreach (var b in weekend.Blocks.Where(b => !lockedIds.Contains(b.Id)).ToList())
        {
            weekend.Blocks.Remove(b);
            _db.ItineraryBlocks.Remove(b);
        }

        // Planner output includes locked blocks (added by BuildFixedBlocks). Skip those when adding.
        foreach (var b in planned.Where(p => !lockedIds.Contains(p.Id)))
        {
            var block = new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                WeekendId = weekend.Id,
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
                FromCalendar = b.FromCalendar
            };
            // EF's relationship fix-up puts the block in the tracked weekend.Blocks
            // (WeekendId is set); adding it there too listed it twice (L2-188).
            _db.ItineraryBlocks.Add(block);
        }

        await _db.SaveChangesAsync(ct);

        weekend.Home = GeoLocation.Merge(weekend.Home, ctx.Home.Copy());
        return ctx;
    }

    /// <summary>
    /// Re-plans one day (L2-085): the other day is fixed wholesale and, on <paramref name="day"/>,
    /// only locked blocks survive, commitments and date blocks among them (L2-011 AC2, L2-222). Saves.
    /// </summary>
    public async Task<PlannerContext> ReplanDayAsync(Weekend weekend, Guid familyId, DayOfWeekend day, int seed, CancellationToken ct)
    {
        var fixedBlocks = weekend.Blocks.Where(b => b.Day != day || b.IsLocked).ToList();
        var ctx = await _loader.LoadAsync(familyId, weekend.WeekendOf, ct);
        var planned = _planner.Plan(ctx.ToInputs(fixedBlocks, weekend.Errands.FirstOrDefault(e => !e.Done), seed));

        var fixedIds = fixedBlocks.Select(b => b.Id).ToHashSet();
        foreach (var block in weekend.Blocks.Where(b => b.Day == day && !fixedIds.Contains(b.Id)).ToList())
        {
            weekend.Blocks.Remove(block);
            _db.ItineraryBlocks.Remove(block);
        }

        foreach (var block in planned.Where(b => b.Day == day && !fixedIds.Contains(b.Id)))
        {
            _db.ItineraryBlocks.Add(new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                WeekendId = weekend.Id,
                Day = block.Day,
                StartTime = block.StartTime,
                EndTime = block.EndTime,
                Kind = block.Kind,
                Title = block.Title,
                RefId = block.RefId,
                IsLocked = block.IsLocked,
                Reason = block.Reason,
                SortOrder = block.SortOrder,
                Stop = block.Stop?.Copy(),
                FromCalendar = block.FromCalendar
            });
        }

        await _db.SaveChangesAsync(ct);
        return ctx;
    }
}
