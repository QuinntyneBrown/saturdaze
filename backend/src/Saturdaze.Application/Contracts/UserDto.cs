using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Contracts;

/// <param name="AvatarUrl">
/// Anonymous capability URL of the profile photo, or null when none is set (L2-087).
/// </param>
public record UserDto(
    Guid Id,
    string Email,
    UserRole Role,
    DateTimeOffset? EmailVerifiedUtc,
    string? AvatarUrl = null
)
{
    public static UserDto From(User user) => new(
        user.Id,
        user.Email,
        user.Role,
        user.EmailVerifiedUtc,
        user.AvatarToken is { } token ? $"/api/avatars/{token:N}" : null);
}
