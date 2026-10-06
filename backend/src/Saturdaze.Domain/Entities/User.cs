using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string NormalizedEmail { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.User;
    public Guid? FamilyId { get; set; }
    public DateTimeOffset? EmailVerifiedUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset UpdatedAtUtc { get; set; }

    /// <summary>
    /// Capability token of the current profile photo (<see cref="UserAvatar"/>);
    /// rotated on every upload, null when no photo is set (L2-087).
    /// </summary>
    public Guid? AvatarToken { get; set; }
}
