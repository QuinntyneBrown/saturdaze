using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Planning;

public sealed record PlannerInputs(
    Guid FamilyId,
    DateOnly WeekendOf,
    IReadOnlyList<FamilyMember> Members,
    IReadOnlyList<Commitment> Commitments,
    IReadOnlyList<Preference> Preferences,
    IReadOnlyList<Activity> Activities,
    IReadOnlyList<Restaurant> Restaurants,
    IReadOnlyList<LocalEvent> Events,
    IReadOnlyList<WeatherForecast> Forecast,
    IReadOnlyList<HistoricalActivity> History,
    ShoppingErrand? Errand,
    IReadOnlyList<ItineraryBlock> LockedBlocks,
    bool TryNew,
    int Seed,
    IReadOnlyList<CalendarCommitment>? CalendarCommitments = null);

/// <summary>
/// A timed event from a connected calendar on one weekend day, in local time
/// (L2-169); <see cref="WeekendPlanner"/> plans around it like a commitment.
/// </summary>
public sealed record CalendarCommitment(DayOfWeekend Day, TimeOnly Start, TimeOnly End, string Title);

/// <summary>An activity from an earlier weekend, with that weekend's rating (L2-027 AC3).</summary>
public sealed record HistoricalActivity(DateOnly WeekendOf, Guid ActivityId, int? Rating = null);
