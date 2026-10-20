using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Common;

/// <summary>
/// Resolves the caller's family from <c>Users.FamilyId</c>. The <c>family_id</c>
/// claim is not trusted: a removed member's account is deleted, and their
/// still-unexpired access token shall stop reaching the family (L2-128 #3,
/// ADR-016). Scoped, so one lookup per request is shared by nested MediatR sends.
/// </summary>
public sealed class CurrentUserFamilyAccessor : ICurrentFamilyAccessor
{
    private readonly ICurrentUserAccessor _user;
    private readonly IAppDbContext _db;
    private readonly AdminFamilyScope _scope;
    private Guid? _cached;

    public CurrentUserFamilyAccessor(ICurrentUserAccessor user, IAppDbContext db, AdminFamilyScope scope)
    {
        _user = user;
        _db = db;
        _scope = scope;
    }

    public async Task<Guid> GetCurrentFamilyIdAsync(CancellationToken cancellationToken = default)
    {
        // An administrator acting on another family (ADR-019, L2-158): the family named in
        // the admin route, checked before the cache so nested sends all see the same family.
        if (_scope.FamilyId is { } scoped && _user.Role == UserRole.Admin) return scoped;

        if (_cached is { } cached) return cached;

        if (!_user.IsAuthenticated || _user.UserId is not { } userId)
            throw new InvalidCredentialsException("unauthenticated", "Sign in to continue.");

        var account = await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.FamilyId })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InvalidCredentialsException("unauthenticated", "Sign in to continue.");

        var familyId = account.FamilyId
            ?? throw new NotFoundException("No family has been configured for this account yet.");

        _cached = familyId;
        return familyId;
    }
}
