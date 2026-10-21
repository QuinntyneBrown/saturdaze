using Saturdaze.Application.Weather;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Contracts;

/// <summary>
/// What a share-link viewer sees (L2-086 AC7): the plan, its weather, day totals
/// and cover. The family's notes, errands, home, rating, favourite flag,
/// regeneration count and block reasons stay private, calendar events read "Busy"; errand blocks are left
/// out and directions links, which start at home, are dropped.
/// </summary>
public sealed record SharedWeekendDto(
    Guid Id,
    DateOnly WeekendOf,
    string? Title,
    IReadOnlyList<SharedBlockDto> Blocks,
    IReadOnlyList<WeatherForecast> Weather,
    IReadOnlyList<DayDto>? Days,
    CoverDto? Cover)
{
    public static SharedWeekendDto From(WeekendDto weekend) => new(
        weekend.Id,
        weekend.WeekendOf,
        weekend.Title,
        weekend.Blocks
            .Where(b => b.Kind != BlockKind.Errand)
            .Select(b => new SharedBlockDto(
                // A personal calendar event's title stays with the family (L2-176 AC7).
                b.Id, b.Day, b.StartTime, b.EndTime, b.Kind, b.FromCalendar ? "Busy" : b.Title, b.RefId, b.IsLocked, b.SortOrder,
                b.StopNumber, b.Stop, b.LegBefore is { } leg ? leg with { DirectionsUrl = null } : null, b.Photo))
            .ToList(),
        weekend.Weather,
        weekend.Days,
        weekend.Cover);
}

/// <summary>An itinerary block as a share viewer sees it: no reason.</summary>
public sealed record SharedBlockDto(
    Guid Id,
    DayOfWeekend Day,
    TimeOnly StartTime,
    TimeOnly EndTime,
    BlockKind Kind,
    string Title,
    Guid? RefId,
    bool IsLocked,
    int SortOrder,
    int? StopNumber,
    LocationDto? Stop,
    TravelLegDto? LegBefore,
    PlacePhotoDto? Photo);
