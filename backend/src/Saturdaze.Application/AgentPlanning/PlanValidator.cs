using Saturdaze.Application.Planning;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.AgentPlanning;

/// <summary>One broken hard rule: the pick it concerns (null for the plan as a whole), the rule code and detail.</summary>
public sealed record PickViolation(DraftPick? Pick, string Rule, string Detail)
{
    public override string ToString() => Pick is null
        ? $"{Rule}: {Detail}"
        : $"{Pick.Day} {Pick.Kind.ToString().ToLowerInvariant()} {Pick.Id}{(Pick.Start is { } s ? $" at {s:HH\\:mm}" : string.Empty)} — {Rule}: {Detail}";
}

public sealed record ValidationReport(IReadOnlyList<PickViolation> Violations, IReadOnlyList<DraftPick> Passing)
{
    public bool Clean => Violations.Count == 0;
}

/// <summary>
/// The planner's authority over agent drafts (L2-206): every rule a pick or the assembled plan
/// can break, with its code. A pick with a violation is never applied. Built on the same
/// <see cref="CandidateFilter"/> and fit the planner itself uses.
/// </summary>
public sealed class PlanValidator
{
    /// <summary>An outdoor outing needs this much daylight, or its whole visit when shorter.</summary>
    public const int DaylightMinutes = 60;

    public ValidationReport Validate(
        PlannerInputs inputs, IReadOnlySet<Guid> shortlisted, IReadOnlyList<DraftPick> picks, IReadOnlyList<ItineraryBlock> assembled)
    {
        var violations = new List<PickViolation>();
        var profile = inputs.Boundaries;
        var seen = new HashSet<Guid>(inputs.LockedBlocks.Where(b => b.Kind == BlockKind.Activity && b.RefId is not null).Select(b => b.RefId!.Value));
        var perDay = new Dictionary<DayOfWeekend, int>();

        foreach (var pick in picks)
        {
            void Fail(string rule, string detail) => violations.Add(new PickViolation(pick, rule, detail));

            var c = CandidateFilter.Find(inputs, pick.Id);
            if (c is null || (c.Kind == CandidateKind.Event) != (pick.Kind == PickKind.Event))
            {
                Fail("unknown_place", "the id is not a published activity or event of the catalog");
                continue;
            }
            if (shortlisted.Count > 0 && !shortlisted.Contains(pick.Id)) Fail("not_shortlisted", $"{c.Name} was not on the curator's shortlist");
            if (!seen.Add(pick.Id)) Fail("duplicate", $"{c.Name} is already on the weekend");

            perDay[pick.Day] = perDay.GetValueOrDefault(pick.Day) + 1;
            if (perDay[pick.Day] > profile.Outings(pick.Day)) Fail("pace", $"more than {profile.Outings(pick.Day)} outings on {pick.Day}");

            if (CandidateFilter.Exclusion(inputs, c, pick.Day) is { } rule) Fail(rule, Explain(rule, c, profile));
            if (c.Kind == CandidateKind.Event && !IsHttps(inputs.Events.First(e => e.Id == c.Id).Url))
                Fail("unverified_source", $"{c.Name} has no https source");

            if (pick.Start is { } start) CheckStart(inputs, pick, c, start, Fail);
        }

        // A pick that broke nothing above but did not land: it collides with what is fixed.
        foreach (var pick in picks.Where(p => violations.All(v => v.Pick != p)))
        {
            var placed = assembled.Any(b => b.Day == pick.Day && b.Kind == BlockKind.Activity && b.RefId == pick.Id && b.Reason == pick.Reason);
            if (!placed)
                violations.Add(new PickViolation(pick, "overlap", "there is no free time for it at that start once meals, commitments and drives are placed"));
        }

        violations.AddRange(PlanRules(inputs, assembled));
        var passing = picks.Where(p => violations.All(v => v.Pick != p)).ToList();
        return new ValidationReport(violations, passing);
    }

    private static void CheckStart(PlannerInputs inputs, DraftPick pick, PlannerCandidate c, TimeOnly start, Action<string, string> fail)
    {
        var profile = inputs.Boundaries;
        if (start < profile.DayStart || start >= profile.DayEnd(pick.Day))
            fail("outside_day", $"{start:HH\\:mm} is outside the family's day {profile.DayStart:HH\\:mm}-{profile.DayEnd(pick.Day):HH\\:mm}");
        var least = c.Kind == CandidateKind.Event ? PlannerCandidate.EventMinMinutes : PlannerTimes.ActivityMinMinutes;
        if (c.OpensAt is { } opens && c.ClosesAt is { } closes && (start < opens || start.AddMinutes(least) > closes))
            fail("closed", $"{c.Name} is open {opens:HH\\:mm}-{closes:HH\\:mm}");
        if (c.IsTimedEvent && (start < c.StartTime!.Value || start.AddMinutes(least) > c.EndTime!.Value))
            fail("event_not_on", $"{c.Name} runs {c.StartTime:HH\\:mm}-{c.EndTime:HH\\:mm}");
        if (c.IsOutdoor && !c.IsTimedEvent && inputs.Sunsets?.GetValueOrDefault(pick.Day) is { } sunset)
        {
            var needs = Math.Min(Math.Max(c.DurationMinutes, PlannerTimes.ActivityMinMinutes), DaylightMinutes);
            if (start.AddMinutes(needs) > sunset || start.AddMinutes(needs) < start)
                fail("after_sunset", $"{c.Name} is outdoors and the sun sets at {sunset:HH\\:mm}");
        }
    }

    /// <summary>The plan as a whole: meals in their windows, commitments and locks where they were.</summary>
    private static IEnumerable<PickViolation> PlanRules(PlannerInputs inputs, IReadOnlyList<ItineraryBlock> plan)
    {
        foreach (var meal in plan.Where(b => b.Kind == BlockKind.Meal))
        {
            var lunch = meal.Title.StartsWith("Lunch", StringComparison.Ordinal);
            var (from, to) = lunch
                ? (PlannerTimes.LunchEarliestStart, PlannerTimes.LunchLatestStart)
                : (PlannerTimes.DinnerEarliestStart, PlannerTimes.DinnerLatestStart);
            if (meal.StartTime < from || meal.StartTime > to)
                yield return new PickViolation(null, "meal_window", $"{meal.Day} {meal.Title} starts at {meal.StartTime:HH\\:mm}");
        }
        foreach (var c in inputs.Commitments)
        {
            var day = c.DayOfWeek == DayOfWeek.Saturday ? DayOfWeekend.Saturday : c.DayOfWeek == DayOfWeek.Sunday ? DayOfWeekend.Sunday : (DayOfWeekend?)null;
            if (day is null) continue;
            // A commitment already on the weekend keeps its locked block (L2-011 AC2); the lock rule covers it.
            if (inputs.LockedBlocks.Any(l => l.Kind == BlockKind.Commitment
                    && (string.Equals(l.Title, c.Title, StringComparison.OrdinalIgnoreCase) || (l.StartTime < c.EndTime && c.StartTime < l.EndTime))))
                continue;
            if (!plan.Any(b => b.Day == day && b.Kind == BlockKind.Commitment && b.StartTime == c.StartTime && b.EndTime == c.EndTime))
                yield return new PickViolation(null, "commitment_moved", $"a {day} commitment at {c.StartTime:HH\\:mm} is not where it was");
        }
        foreach (var locked in inputs.LockedBlocks)
        {
            if (!plan.Any(b => b.Id == locked.Id && b.Day == locked.Day && b.StartTime == locked.StartTime && b.EndTime == locked.EndTime))
                yield return new PickViolation(null, "lock_moved", $"a locked {locked.Day} block at {locked.StartTime:HH\\:mm} moved");
        }
    }

    private static string Explain(string rule, PlannerCandidate c, PlannerProfile profile) => rule switch
    {
        "beyond_max_drive" => $"{c.Name} is {c.DriveMinutes} minutes away, past the {profile.MaxDriveMinutes}-minute max drive",
        "excluded_theme" => $"{c.Name} carries a theme the family leaves out ({string.Join(", ", c.Themes.Where(profile.ExcludedThemes.Contains))})",
        "disliked" => $"{c.Name} matches a dislike",
        "age_misfit" => $"{c.Name} is for ages {c.MinAge}-{c.MaxAge}",
        "out_of_season" => $"{c.Name} is out of season",
        "event_not_on" => $"{c.Name} does not run that day",
        _ => c.Name
    };

    private static bool IsHttps(string url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var u) && u.Scheme == Uri.UriSchemeHttps;
}
