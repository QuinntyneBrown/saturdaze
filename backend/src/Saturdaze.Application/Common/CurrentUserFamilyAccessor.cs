using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Exceptions;

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
    private Guid? _cached;

    public CurrentUserFamilyAccessor(ICurrentUserAccessor user, IAppDbContext db)
    {
        _user = user;
        _db = db;
    }

    public async Task<Guid> GetCurrentFamilyIdAsync(CancellationToken cancellationToken = default)
    {
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
