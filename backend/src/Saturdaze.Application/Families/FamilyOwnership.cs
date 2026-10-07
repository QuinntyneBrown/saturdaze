using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Families;

/// <summary>
/// Only the family's owner changes who's in (L2-125, L2-128, L2-129). A
/// family with no recorded owner is managed by any of its accounts (ADR-016).
/// </summary>
public sealed class FamilyOwnership
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _family;
    private readonly ICurrentUserAccessor _user;

    public FamilyOwnership(IAppDbContext db, ICurrentFamilyAccessor family, ICurrentUserAccessor user)
    {
        _db = db;
        _family = family;
        _user = user;
    }

    public bool IsOwner(Family family) => family.OwnerUserId is null || family.OwnerUserId == _user.UserId;

    /// <summary>Loads the caller's family with its members, or throws 403 <c>owner_only</c>.</summary>
    public async Task<Family> EnsureOwnerAsync(CancellationToken ct)
    {
        var familyId = await _family.GetCurrentFamilyIdAsync(ct);
        var family = await _db.Families
            .Include(f => f.Members)
            .SingleOrDefaultAsync(f => f.Id == familyId, ct)
            ?? throw new NotFoundException(nameof(Family), familyId);

        if (!IsOwner(family))
            throw new ForbiddenException("owner_only", "Only the family's owner can change who's in.");
        return family;
    }
}
