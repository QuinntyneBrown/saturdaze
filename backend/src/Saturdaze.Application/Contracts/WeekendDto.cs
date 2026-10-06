using Saturdaze.Application.Weather;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Contracts;

public sealed record WeekendDto(
    Guid Id,
    DateOnly WeekendOf,
    bool IsFavourite,
    string Notes,
    int RegenerateCount,
    string? Title,
    int? Rating,
    IReadOnlyList<ItineraryBlockDto> Blocks,
    IReadOnlyList<ShoppingErrandDto> Errands,
    IReadOnlyList<WeatherForecast> Weather,
    IReadOnlyList<DayDto>? Days = null,
    LocationDto? Home = null,
    CoverDto? Cover = null);

public sealed record ItineraryBlockDto(
    Guid Id,
    DayOfWeekend Day,
    TimeOnly StartTime,
    TimeOnly EndTime,
    BlockKind Kind,
    string Title,
    Guid? RefId,
    bool IsLocked,
    string Reason,
    int SortOrder,
    int? StopNumber = null,
    LocationDto? Stop = null,
    TravelLegDto? LegBefore = null,
    PlacePhotoDto? Photo = null);

public sealed record ShoppingErrandDto(
    Guid Id,
    string Description,
    int EstimatedMinutes,
    bool Done);
