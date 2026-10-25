namespace Saturdaze.Application.Contracts;

public sealed record ActivityDto(
    Guid Id,
    string Name,
    string Category,
    bool Indoor,
    int MinAge,
    int MaxAge,
    int DriveMinutes,
    IReadOnlyList<string> WeatherTags,
    int TypicalDurationMinutes,
    string Description,
    string MapUrl,
    LocationDto? Location,
    PlacePhotoDto? Photo = null,
    TimeOnly? OpensAt = null,
    TimeOnly? ClosesAt = null,
    int? SeasonStartMonth = null,
    int? SeasonEndMonth = null,
    int? PriceTier = null,
    IReadOnlyList<string>? Themes = null,
    string? SourceUrl = null);
