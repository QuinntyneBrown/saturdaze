using Saturdaze.Application.Authentication;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Tests.Support;

internal sealed class StubCurrentUserAccessor : ICurrentUserAccessor
{
    public Guid? UserId { get; set; }
    public string? Email { get; set; }
    public UserRole? Role { get; set; }
    public Guid? FamilyId { get; set; }
    public bool IsAuthenticated => UserId.HasValue;
}
