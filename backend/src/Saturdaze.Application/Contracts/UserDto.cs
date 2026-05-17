using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Contracts;

public record UserDto(
    Guid Id,
    string Email,
    UserRole Role,
    DateTimeOffset? EmailVerifiedUtc
);
