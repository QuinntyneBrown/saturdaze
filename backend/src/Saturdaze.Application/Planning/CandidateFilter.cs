using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Planning;

/// <summary>
/// Whether a candidate may be planned for this family on a day (L2-185 aside): the family's max
/// drive, excluded themes, dislikes, the members' ages, the season and, for an event, whether it
/// runs that day. One set of rules for the planner, the agents' tools and the validator (L2-206).
/// </summary>
public static class CandidateFilter
{
    /// <summary>The rule code a candidate breaks on <paramref name="day"/>, or null when it may be planned.</summary>
    public static string? Exclusion(PlannerInputs inputs, PlannerCandidate c, DayOfWeekend day)
    {
        var date = day == DayOfWeekend.Saturday ? inputs.WeekendOf : inputs.WeekendOf.AddDays(1);
        var profile = inputs.Boundaries;
        if (c.DriveMinutes > profile.MaxDriveMinutes) return "beyond_max_drive";
        if (c.Themes.Any(profile.ExcludedThemes.Contains)) return "excluded_theme";
        if (inputs.Preferences.Where(p => p.Kind == PreferenceKind.Dislike).Any(p => Disliked(c, p.Value))) return "disliked";
        if (inputs.Members.Count(m => m.Age < c.MinAge || m.Age > c.MaxAge) >= 2) return "age_misfit";
        if (!c.InSeason(date)) return "out_of_season";
        if (c.Kind == CandidateKind.Event && !inputs.Events.Any(e => e.Id == c.Id && e.StartsOn <= date && date <= e.EndsOn))
            return "event_not_on";
        return null;
    }

    public static IEnumerable<PlannerCandidate> Eligible(PlannerInputs inputs, DayOfWeekend day)
    {
        var date = day == DayOfWeekend.Saturday ? inputs.WeekendOf : inputs.WeekendOf.AddDays(1);
        return All(inputs, date).Where(c => Exclusion(inputs, c, day) is null);
    }

    /// <summary>Every activity, and the events running on <paramref name="date"/>.</summary>
    public static IEnumerable<PlannerCandidate> All(PlannerInputs inputs, DateOnly date) =>
        inputs.Activities.Select(PlannerCandidate.From)
            .Concat(inputs.Events.Where(e => e.StartsOn <= date && date <= e.EndsOn).Select(PlannerCandidate.From));

    /// <summary>A catalog activity or published event by id, whatever its dates.</summary>
    public static PlannerCandidate? Find(PlannerInputs inputs, Guid id) =>
        inputs.Activities.Where(a => a.Id == id).Select(PlannerCandidate.From).FirstOrDefault()
        ?? inputs.Events.Where(e => e.Id == id).Select(PlannerCandidate.From).FirstOrDefault();

    /// <summary>A dislike of "Indoor" or "Outdoor" reads the place's flag (L2-194 AC5); others match text.</summary>
    public static bool Disliked(PlannerCandidate c, string dislike) =>
        string.Equals(dislike.Trim(), "Indoor", StringComparison.OrdinalIgnoreCase) ? c.Indoor == true
        : string.Equals(dislike.Trim(), "Outdoor", StringComparison.OrdinalIgnoreCase) ? c.Indoor == false
        : Matches(c, dislike);

    public static bool Matches(PlannerCandidate c, string tag) =>
        c.Tags.Any(t => string.Equals(t, tag, StringComparison.OrdinalIgnoreCase))
        || string.Equals(c.Category, tag, StringComparison.OrdinalIgnoreCase)
        || c.Name.Contains(tag, StringComparison.OrdinalIgnoreCase)
        || c.Description.Contains(tag, StringComparison.OrdinalIgnoreCase);
}
