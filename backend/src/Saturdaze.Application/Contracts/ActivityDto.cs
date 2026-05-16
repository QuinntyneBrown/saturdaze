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
    string MapUrl);
