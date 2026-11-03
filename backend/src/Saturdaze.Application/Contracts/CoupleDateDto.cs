using Saturdaze.Application.Dates;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Contracts;

/// <summary>A couple's date (L2-219): who, when, where, its steps and who needs care meanwhile (L2-222).</summary>
public sealed record CoupleDateDto(
    Guid Id,
    Guid WeekendId,
    DayOfWeekend Day,
    MealSlot Meal,
    TimeOnly StartTime,
    TimeOnly EndTime,
    IReadOnlyList<DateAttendeeDto> Attendees,
    DateRestaurantDto Restaurant,
    DateActivityDto? Activity,
    IReadOnlyList<DateStep> Steps,
    IReadOnlyList<string> KidsNeedCare,
    string Title);

public sealed record DateAttendeeDto(Guid Id, string Name);

public sealed record DateRestaurantDto(Guid Id, string Name, string Style, LocationDto? Location);

public sealed record DateActivityDto(Guid Id, string Name, LocationDto? Location);

/// <summary>The weekend's dates and whether another can be planned (L2-219 AC4).</summary>
public sealed record CoupleDatesDto(
    IReadOnlyList<CoupleDateDto> Dates,
    IReadOnlyList<DateAdultDto> Adults,
    bool CanPlan,
    string? Reason);

public sealed record DateAdultDto(Guid Id, string Name, int Age);

/// <summary>A past weekend's date, for <c>/past</c> (L2-225 AC7).</summary>
public sealed record DateSummaryDto(DayOfWeekend Day, MealSlot Meal, string Restaurant, IReadOnlyList<string> Attendees);
