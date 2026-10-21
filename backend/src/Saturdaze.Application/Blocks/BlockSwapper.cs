using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Planning;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Blocks;

/// <summary>
/// Replaces an unlocked activity block of a loaded weekend with the next best
/// pick, keeping the block's ID and replacing only the drives around it
/// (L2-015). Shared by the family's swap and the administrator's sample
/// weekend (L2-160). Saves; callers map the result.
/// </summary>
public sealed class BlockSwapper
{
    public const string NoAlternativeReason = "no alternative available — kept this pick";

    private readonly IAppDbContext _db;
    private readonly IWeekendPlanner _planner;
    private readonly PlannerInputLoader _loader;

    public BlockSwapper(IAppDbContext db, IWeekendPlanner planner, PlannerInputLoader loader)
    {
        _db = db;
        _planner = planner;
        _loader = loader;
    }

    /// <summary>Returns the planner context so the caller can map with its forecast.</summary>
    public async Task<PlannerContext> SwapAsync(
        Weekend weekend,
        ItineraryBlock target,
        Guid familyId,
        IReadOnlyList<Guid>? rejectedActivityIds,
        CancellationToken ct)
    {
        if (target.Kind != BlockKind.Activity)
            throw new ConflictException("block_not_swappable", "Only activity blocks can be swapped.");
        if (target.IsLocked)
            throw new ConflictException("block_locked", "Locked blocks cannot be swapped. Unlock first.");

        var dayBlocks = weekend.Blocks.Where(b => b.Day == target.Day).OrderBy(b => b.StartTime).ToList();
        var adjacentDrives = dayBlocks
            .Where(b => b.Kind == BlockKind.Drive && (b.EndTime == target.StartTime || b.StartTime == target.EndTime))
            .ToList();
        var window = (start: adjacentDrives.Concat(new[] { target }).Min(b => b.StartTime),
                      end:   adjacentDrives.Concat(new[] { target }).Max(b => b.EndTime));

        var ctx = await _loader.LoadAsync(familyId, weekend.WeekendOf, ct);
        var dayForecast = ctx.ForecastFor(target.Day);

        // Never offer what the client rejected, what is already on the
        // weekend, or the activity being swapped away.
        var rejected = new HashSet<Guid>(rejectedActivityIds ?? Array.Empty<Guid>());
        foreach (var onWeekend in weekend.Blocks.Where(b => b.Kind == BlockKind.Activity && b.RefId is not null))
            rejected.Add(onWeekend.RefId!.Value);
        if (target.RefId is Guid currentActivityId) rejected.Add(currentActivityId);

        var inputs = ctx.ToInputs(
            lockedBlocks: Array.Empty<ItineraryBlock>(),
            errand: null,
            seed: weekend.WeekendOf.DayNumber + (rejectedActivityIds?.Count ?? 0) + 1);

        var pick = _planner.PickActivityForGap(inputs, target.Day, window.start, window.end, rejected);
        if (pick is null)
        {
            // L2-015 AC3: nothing left to offer is a no-op, not an error.
            if (!target.Reason.Contains(NoAlternativeReason, StringComparison.Ordinal))
                target.Reason = string.IsNullOrWhiteSpace(target.Reason)
                    ? NoAlternativeReason
                    : $"{target.Reason}; {NoAlternativeReason}";
            await _db.SaveChangesAsync(ct);
            return ctx;
        }

        var newBlocks = _planner.BuildActivityBlocks(
            pick, target.Day, window.start, window.end, dayForecast, tryNew: false);

        // The block keeps its ID and takes the new activity (L2-015 AC1); only
        // the drive blocks around it are replaced.
        var replacement = newBlocks.Single(b => b.Kind == BlockKind.Activity);
        target.StartTime = replacement.StartTime;
        target.EndTime = replacement.EndTime;
        target.Title = replacement.Title;
        target.RefId = replacement.RefId;
        target.Reason = "swap pick: " + replacement.Reason;
        target.Stop = replacement.Stop?.Copy();

        foreach (var old in adjacentDrives)
        {
            weekend.Blocks.Remove(old);
            _db.ItineraryBlocks.Remove(old);
        }
        var nextSort = weekend.Blocks.Where(b => b.Day == target.Day).Max(b => (int?)b.SortOrder) ?? 0;
        foreach (var nb in newBlocks.Where(b => b.Kind == BlockKind.Drive))
        {
            var drive = new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                WeekendId = weekend.Id,
                Day = nb.Day,
                StartTime = nb.StartTime,
                EndTime = nb.EndTime,
                Kind = nb.Kind,
                Title = nb.Title,
                RefId = nb.RefId,
                Reason = "swap pick: " + nb.Reason,
                SortOrder = ++nextSort,
                Stop = nb.Stop?.Copy()
            };
            _db.ItineraryBlocks.Add(drive);
            weekend.Blocks.Add(drive);
        }
        await _db.SaveChangesAsync(ct);
        return ctx;
    }
}
