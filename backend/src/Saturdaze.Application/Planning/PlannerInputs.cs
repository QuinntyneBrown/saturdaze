using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;

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
    int Seed);

public sealed record HistoricalActivity(DateOnly WeekendOf, Guid ActivityId);
