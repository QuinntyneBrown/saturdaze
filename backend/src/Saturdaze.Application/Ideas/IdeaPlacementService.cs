using Saturdaze.Application.Planning;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Ideas;

/// <summary>Where an idea fits: its own start and end plus the blocks it displaces.</summary>
public sealed record IdeaPlacement(
    bool Fits,
    TimeOnly Start,
    TimeOnly End,
    IReadOnlyList<ItineraryBlock> Replaced,
    string? Reason);

/// <summary>
/// Fits an idea into one day (L2-107). Locked blocks, commitments, meals and errands
/// stay put (L1-004). Unlocked activities (with their drives) and downtime may give way.
/// The idea needs its drive there, its own time, and its drive back; the earliest gap
/// between fixed blocks that holds all three, within the chosen timing, wins.
/// </summary>
public static class IdeaPlacementService
{
    private static readonly TimeOnly Noon = new(12, 0);

    public static IdeaPlacement Place(IReadOnlyList<ItineraryBlock> day, ResolvedIdea idea, IdeaTiming timing)
    {
        var fixedBlocks = day.Where(IsFixed).OrderBy(b => b.StartTime).ToList();
        var drive = Math.Max(0, idea.DriveMinutes);
        var need = TimeSpan.FromMinutes(drive * 2 + idea.DurationMinutes);

        foreach (var (gapStart, gapEnd) in Gaps(fixedBlocks))
        {
            var start = gapStart;
            if (timing == IdeaTiming.Afternoon && start < Noon) start = Noon;
            if (timing == IdeaTiming.Morning && start >= Noon) continue;
            if (start >= gapEnd || gapEnd - start < need) continue;

            var outbound = start;
            var back = start.Add(need);
            var ideaStart = start.AddMinutes(drive);
            var ideaEnd = ideaStart.AddMinutes(idea.DurationMinutes);
            return new IdeaPlacement(true, ideaStart, ideaEnd, Displaced(day, outbound, back), null);
        }

        var when = timing switch
        {
            IdeaTiming.Morning => "morning ",
            IdeaTiming.Afternoon => "afternoon ",
            _ => string.Empty
        };
        return new IdeaPlacement(false, default, default, Array.Empty<ItineraryBlock>(),
            $"No {when}slot is long enough without moving locked blocks or commitments.");
    }

    private static bool IsFixed(ItineraryBlock b) =>
        b.IsLocked || b.Kind is BlockKind.Commitment or BlockKind.Meal or BlockKind.Errand;

    private static IEnumerable<(TimeOnly Start, TimeOnly End)> Gaps(IReadOnlyList<ItineraryBlock> fixedBlocks)
    {
        var cursor = PlannerTimes.DayStart;
        foreach (var b in fixedBlocks)
        {
            if (b.StartTime > cursor) yield return (cursor, b.StartTime);
            if (b.EndTime > cursor) cursor = b.EndTime;
        }

        if (cursor < PlannerTimes.DayEnd) yield return (cursor, PlannerTimes.DayEnd);
    }

    /// <summary>
    /// Movable blocks overlapping [from, to). An activity goes with the drives that touch
    /// it, so no drive is left leading to a place that is no longer visited.
    /// </summary>
    private static IReadOnlyList<ItineraryBlock> Displaced(IReadOnlyList<ItineraryBlock> day, TimeOnly from, TimeOnly to)
    {
        var movable = day.Where(b => !IsFixed(b)).ToList();
        var hit = movable.Where(b => b.StartTime < to && from < b.EndTime).ToHashSet();
        foreach (var activity in hit.Where(b => b.Kind == BlockKind.Activity).ToList())
        {
            foreach (var drive in movable.Where(d => d.Kind == BlockKind.Drive
                                                     && (d.EndTime == activity.StartTime || d.StartTime == activity.EndTime)))
                hit.Add(drive);
        }

        return hit.OrderBy(b => b.StartTime).ToList();
    }
}
