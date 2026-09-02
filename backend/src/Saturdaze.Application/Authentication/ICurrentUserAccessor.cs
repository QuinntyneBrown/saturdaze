using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Authentication;

public interface ICurrentUserAccessor
{
    Guid? UserId { get; }
    string? Email { get; }
    UserRole? Role { get; }
    Guid? FamilyId { get; }
    bool IsAuthenticated { get; }

    /// <summary>Remote address of the current request when one is available.</summary>
    string? IpAddress { get; }
}
