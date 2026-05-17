namespace Saturdaze.Application.Contracts;

public record AuthTokenDeliveryDto(
    string? Email,
    string? Token,
    DateTimeOffset? ExpiresAtUtc
);
