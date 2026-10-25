namespace Saturdaze.Application.Families;

/// <summary>
/// When commitments on the same day may overlap (L2-192): only when every one of a
/// group running at once names its attendees, no member is in two of them, and the
/// family has an adult to take each.
/// </summary>
public static class CommitmentOverlaps
{
    public const int AdultAge = 18;

    public const string Message =
        "Commitments on the same day must not overlap unless different people go and an adult can take each.";

    /// <param name="adults">The family's adults, or null when unknown (the attendee rules still apply).</param>
    public static bool AreSplittable(IReadOnlyList<SaveCommitmentInput> commitments, int? adults)
    {
        foreach (var day in commitments.GroupBy(c => c.DayOfWeek))
        {
            var ordered = day.OrderBy(c => c.StartTime).ToList();
            foreach (var group in OverlapGroups(ordered))
            {
                if (group.Count < 2) continue;
                if (group.Any(c => c.AttendeeMemberIds is not { Count: > 0 })) return false;
                var attendees = group.SelectMany(c => c.AttendeeMemberIds!).ToList();
                if (attendees.Distinct().Count() != attendees.Count) return false;
                if (adults is { } count && MostAtOnce(group) > count) return false;
            }
        }
        return true;
    }

    /// <summary>Runs of commitments chained by overlap.</summary>
    private static IEnumerable<List<SaveCommitmentInput>> OverlapGroups(List<SaveCommitmentInput> ordered)
    {
        var group = new List<SaveCommitmentInput>();
        var end = TimeOnly.MinValue;
        foreach (var c in ordered)
        {
            if (group.Count > 0 && c.StartTime >= end)
            {
                yield return group;
                group = new List<SaveCommitmentInput>();
            }
            if (group.Count == 0 || c.EndTime > end) end = c.EndTime;
            group.Add(c);
        }
        if (group.Count > 0) yield return group;
    }

    private static int MostAtOnce(List<SaveCommitmentInput> group) =>
        group.Max(c => group.Count(o => o.StartTime < c.EndTime && c.StartTime < o.EndTime && o.StartTime <= c.StartTime));
}
