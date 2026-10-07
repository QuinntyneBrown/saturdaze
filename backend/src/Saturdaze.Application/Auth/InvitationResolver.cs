using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Auth;

/// <summary>
/// Finds a usable invitation by its raw token (L2-127 #4). A missing or
/// accepted invitation is <c>token_invalid</c>; removing the member deletes
/// the invitation, so a revoked one is missing.
/// </summary>
public sealed class InvitationResolver
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _tokens;
    private readonly IDateTimeProvider _clock;

    public InvitationResolver(IAppDbContext db, IJwtTokenService tokens, IDateTimeProvider clock)
    {
        _db = db;
        _tokens = tokens;
        _clock = clock;
    }

    public async Task<FamilyInvitation> ResolveAsync(string token, CancellationToken ct)
    {
        var hash = _tokens.HashRefreshToken(token ?? string.Empty);
        var invitation = await _db.FamilyInvitations.FirstOrDefaultAsync(i => i.TokenHash == hash, ct);
        if (invitation is null || invitation.AcceptedAtUtc is not null)
            throw new AuthFlowException(400, "token_invalid", "This invite no longer works.");
        if (invitation.ExpiresAtUtc <= _clock.UtcNow)
            throw new AuthFlowException(400, "token_expired", "This invite has expired.");
        return invitation;
    }
}
