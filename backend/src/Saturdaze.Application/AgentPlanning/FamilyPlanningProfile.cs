using System.Text;
using Saturdaze.Application.Planning;
using Saturdaze.Application.Travel;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.AgentPlanning;

/// <summary>
/// What the curator and drafter may know about the family (L2-209): members as role and age
/// with their interests, commitments as day, time, attendee roles and drive, and the family's
/// boundaries. Never names, emails, the home address or coordinates, or commitment titles.
/// </summary>
public static class FamilyPlanningProfile
{
    public static string Describe(Family family, PlannerInputs inputs)
    {
        var profile = inputs.Boundaries;
        var sb = new StringBuilder();
        sb.AppendLine("Family planning profile:");
        sb.AppendLine("- Members: " + string.Join("; ", family.Members.OrderByDescending(m => m.Age).Select(Member)));
        sb.AppendLine($"- Max drive: {profile.MaxDriveMinutes} minutes each way");
        sb.AppendLine("- Leaves out themes: " + (profile.ExcludedThemes.Count == 0 ? "none" : string.Join(", ", profile.ExcludedThemes.Order())));
        sb.AppendLine($"- Day: starts {profile.DayStart:HH\\:mm}; Saturday ends {profile.DayEnd(DayOfWeekend.Saturday):HH\\:mm}, " +
                      $"Sunday ends {profile.DayEnd(DayOfWeekend.Sunday):HH\\:mm}");
        sb.AppendLine($"- Pace: {profile.Outings(DayOfWeekend.Saturday)} outings on Saturday, {profile.Outings(DayOfWeekend.Sunday)} on Sunday" +
                      (profile.QuietSunday ? " (a quiet Sunday: worship and rest)" : string.Empty));
        sb.AppendLine($"- Leaning: {profile.Leaning}; Sunday dinner at home: {(profile.SundayDinnerAtHome ? "yes" : "no")}");
        var likes = inputs.Preferences.Where(p => p.Kind == PreferenceKind.Like).Select(p => p.Value).ToList();
        var dislikes = inputs.Preferences.Where(p => p.Kind == PreferenceKind.Dislike).Select(p => p.Value).ToList();
        sb.AppendLine("- Likes: " + (likes.Count == 0 ? "none" : string.Join(", ", likes)));
        sb.AppendLine("- Dislikes: " + (dislikes.Count == 0 ? "none" : string.Join(", ", dislikes)));
        sb.AppendLine("- Commitments: " + (family.Commitments.Count == 0
            ? "none"
            : string.Join("; ", family.Commitments
                .OrderBy(c => c.DayOfWeek == DayOfWeek.Sunday ? 1 : 0).ThenBy(c => c.StartTime)
                .Select(c => Commitment(c, family, inputs.Home)))));
        return sb.ToString();
    }

    private static string Member(FamilyMember m)
    {
        var role = m.Age >= 18 ? "adult" : "child";
        return m.Interests.Count == 0 ? $"{role}, {m.Age}" : $"{role}, {m.Age} (into {string.Join(", ", m.Interests)})";
    }

    private static string Commitment(Commitment c, Family family, GeoLocation? home)
    {
        var who = c.AttendeeMemberIds.Count == 0
            ? "everyone"
            : string.Join(" and ", family.Members.Where(m => c.AttendeeMemberIds.Contains(m.Id))
                .Select(m => $"{(m.Age >= 18 ? "adult" : "child")}, {m.Age}"));
        var drive = c.Location is null ? string.Empty : $", {FamilyDriveTime.Minutes(home, c.Location, 0)} min drive each way";
        return $"{c.DayOfWeek} {c.StartTime:HH\\:mm}-{c.EndTime:HH\\:mm} ({who}{drive})";
    }

    /// <summary>The words that must never reach a prompt for this family (L2-209 input control).</summary>
    public static IReadOnlyList<string> ForbiddenTerms(Family family, IEnumerable<string> emails)
    {
        var terms = new List<string>();
        terms.AddRange(family.Members.Select(m => m.Name).Where(n => n.Trim().Length >= 3));
        terms.AddRange(emails.Where(e => !string.IsNullOrWhiteSpace(e)));
        if (!string.IsNullOrWhiteSpace(family.HomeLocation))
            terms.AddRange(family.HomeLocation.Split(',').Select(p => p.Trim()).Where(p => p.Any(char.IsDigit) && p.Length >= 4));
        if (family.HomeCoordinates is { } home)
            terms.Add(home.Latitude.ToString("0.0###", System.Globalization.CultureInfo.InvariantCulture));
        terms.Add(family.Id.ToString());
        return terms.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }
}
