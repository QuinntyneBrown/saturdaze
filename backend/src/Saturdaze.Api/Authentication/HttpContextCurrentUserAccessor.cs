using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Saturdaze.Application.Authentication;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Api.Authentication;

public class HttpContextCurrentUserAccessor : ICurrentUserAccessor
{
    private readonly IHttpContextAccessor _ctx;

    public HttpContextCurrentUserAccessor(IHttpContextAccessor ctx) { _ctx = ctx; }

    private ClaimsPrincipal? Principal => _ctx.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public Guid? UserId
    {
        get
        {
            var raw = Principal?.FindFirstValue(JwtRegisteredClaimNames.Sub)
                   ?? Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }

    public string? Email => Principal?.FindFirstValue(JwtRegisteredClaimNames.Email)
                         ?? Principal?.FindFirstValue(ClaimTypes.Email);

    public UserRole? Role
    {
        get
        {
            var raw = Principal?.FindFirstValue(ClaimTypes.Role);
            return Enum.TryParse<UserRole>(raw, out var r) ? r : null;
        }
    }

    public Guid? FamilyId
    {
        get
        {
            var raw = Principal?.FindFirstValue("family_id");
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }
}
