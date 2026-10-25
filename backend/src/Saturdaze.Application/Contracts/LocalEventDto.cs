namespace Saturdaze.Application.Contracts;

public sealed record LocalEventDto(
    Guid Id,
    string Name,
    DateOnly StartsOn,
    DateOnly EndsOn,
    string Venue,
    int DriveMinutes,
    string Url,
    string Category,
    LocationDto? Location,
    PlacePhotoDto? Photo = null,
    bool? Indoor = null,
    TimeOnly? StartTime = null,
    TimeOnly? EndTime = null,
    int? PriceTier = null,
    int? MinAge = null,
    int? MaxAge = null,
    IReadOnlyList<string>? Themes = null);
