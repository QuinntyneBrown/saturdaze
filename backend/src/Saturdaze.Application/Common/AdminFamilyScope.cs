using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Common;

/// <summary>
/// The family an administrator is acting on for this request (ADR-019). Only the admin
/// family handlers enter it; <see cref="CurrentUserFamilyAccessor"/> then resolves that
/// family instead of the administrator's own, so the family's weekend handlers run
/// unchanged for it (L2-158). Scoped: one request, one family.
/// </summary>
public sealed class AdminFamilyScope
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _user;

    public AdminFamilyScope(IAppDbContext db, ICurrentUserAccessor user)
    {
        _db = db;
        _user = user;
    }

    /// <summary>The scoped family, or null when the request is not an administrator acting on a family.</summary>
    public Guid? FamilyId { get; private set; }

    /// <summary>Enters <paramref name="familyId"/>: the caller shall be an administrator and the family shall exist (404 otherwise).</summary>
    public async Task EnterAsync(Guid familyId, CancellationToken ct)
    {
        if (_user.Role != UserRole.Admin)
            throw new ForbiddenException("forbidden", "Only an administrator can act on another family.");
        var exists = await _db.Families.AsNoTracking().AnyAsync(f => f.Id == familyId, ct);
        if (!exists) throw new NotFoundException(nameof(Domain.Entities.Family), familyId);
        FamilyId = familyId;
    }
}
