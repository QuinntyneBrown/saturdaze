using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Exceptions;

namespace Saturdaze.Application.Common;

/// <summary>
/// Resolves the caller's family: the <c>family_id</c> JWT claim first, then
/// <c>Users.FamilyId</c> (covers tokens minted before the family existed).
/// Scoped, so one lookup per request is shared by nested MediatR sends.
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

        var familyId = _user.FamilyId
            ?? await _db.Users.AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => u.FamilyId)
                .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException("No family has been configured for this account yet.");

        _cached = familyId;
        return familyId;
    }
}
