using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Planning;

/// <summary>
/// The family's planning boundaries as the planner reads them (L2-191, L2-194, L2-195):
/// when the day starts and ends, how many outings it holds, how far the family drives,
/// what it leaves out and how it eats on Sunday evening.
/// </summary>
public sealed record PlannerProfile(
    TimeOnly DayStart,
    TimeOnly? YoungestBedtime,
    int OutingsPerDay,
    bool QuietSunday,
    bool SundayDinnerAtHome,
    PlanLeaning Leaning,
    int MaxDriveMinutes,
    IReadOnlySet<string> ExcludedThemes)
{
    /// <summary>What a family that never changed a setting gets; no drive limit until one is set.</summary>
    public static readonly PlannerProfile Default = new(
        PlannerTimes.DayStart, null, 2, false, true, PlanLeaning.Either, int.MaxValue,
        new HashSet<string>(StringComparer.OrdinalIgnoreCase));

    /// <summary>Half an hour before the youngest's bedtime, never after the planner's own bound.</summary>
    public TimeOnly DayEnd(DayOfWeekend day)
    {
        var bound = day == DayOfWeekend.Sunday ? PlannerTimes.SundayWindDownStart : PlannerTimes.DayEnd;
        if (YoungestBedtime is not { } bedtime) return bound;
        var beforeBed = bedtime.AddMinutes(-30);
        return beforeBed < bound ? beforeBed : bound;
    }

    public int Outings(DayOfWeekend day) => day == DayOfWeekend.Sunday && QuietSunday ? 1 : OutingsPerDay;
}
