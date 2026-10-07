using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Families;

/// <summary>
/// Loads a family and projects it for the caller: who owns it and how each
/// member signs in (L2-124). Shared by the profile read and every write that
/// answers with the saved profile.
/// </summary>
public sealed class FamilyProfileReader
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _user;

    public FamilyProfileReader(IAppDbContext db, ICurrentUserAccessor user)
    {
        _db = db;
        _user = user;
    }

    public async Task<FamilyProfileDto?> ReadAsync(Guid familyId, CancellationToken ct)
    {
        var family = await _db.Families
            .AsNoTracking()
            .Include(f => f.Members)
            .Include(f => f.Commitments)
            .Include(f => f.Preferences)
            .SingleOrDefaultAsync(f => f.Id == familyId, ct);
        if (family is null) return null;

        var ownerEmail = family.OwnerUserId is { } ownerId
            ? await _db.Users.AsNoTracking().Where(u => u.Id == ownerId).Select(u => u.Email).FirstOrDefaultAsync(ct)
            : null;

        // An ownerless family is managed by any of its accounts (ADR-016), so
        // every caller is shown the owner's controls.
        var isOwner = family.OwnerUserId is null || family.OwnerUserId == _user.UserId;

        return FamilyProfileMapper.ToDto(family, isOwner, ownerEmail);
    }
}
