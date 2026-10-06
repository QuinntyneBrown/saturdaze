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
    LocationDto? Location);
