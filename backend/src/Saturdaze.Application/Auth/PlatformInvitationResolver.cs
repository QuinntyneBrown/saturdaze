using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Auth;

/// <summary>
/// Finds a usable platform invitation by its raw token (L2-161 AC6). A
/// missing, accepted or revoked invitation is <c>token_invalid</c>; a past
/// expiry is <c>token_expired</c>. Nothing else is revealed.
/// </summary>
public sealed class PlatformInvitationResolver
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _tokens;
    private readonly IDateTimeProvider _clock;

    public PlatformInvitationResolver(IAppDbContext db, IJwtTokenService tokens, IDateTimeProvider clock)
    {
        _db = db;
        _tokens = tokens;
        _clock = clock;
    }

    public async Task<PlatformInvitation> ResolveAsync(string? token, CancellationToken ct)
    {
        var hash = _tokens.HashRefreshToken(token ?? string.Empty);
        var invitation = await _db.PlatformInvitations.FirstOrDefaultAsync(i => i.TokenHash == hash, ct);
        if (invitation is null || invitation.AcceptedAtUtc is not null || invitation.RevokedAtUtc is not null)
            throw new AuthFlowException(400, "token_invalid", "This invite no longer works.");
        if (invitation.ExpiresAtUtc <= _clock.UtcNow)
            throw new AuthFlowException(400, "token_expired", "This invite has expired.");
        return invitation;
    }
}
