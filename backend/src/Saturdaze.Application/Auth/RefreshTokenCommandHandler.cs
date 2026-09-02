using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;

namespace Saturdaze.Application.Auth;

/// <summary>
/// Rotates a refresh token: the presented token is revoked and linked to its
/// replacement, and a new access token is minted with the user's current
/// role and family claims. Every failure is a 401 so the client's only
/// recovery is a fresh sign-in.
/// </summary>
public sealed class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthSuccessDto>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _clock;
    private readonly RefreshTokenIssuer _issuer;

    public RefreshTokenCommandHandler(
        IAppDbContext db,
        IJwtTokenService jwt,
        IDateTimeProvider clock,
        RefreshTokenIssuer issuer)
    {
        _db = db;
        _jwt = jwt;
        _clock = clock;
        _issuer = issuer;
    }

    public async Task<AuthSuccessDto> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        // Everything on this path uses IDateTimeProvider so expiry is testable;
        // only the JWT itself is stamped with the real clock (JwtTokenService).
        var now = _clock.UtcNow;
        var hash = _jwt.HashRefreshToken(request.RefreshToken);

        var existing = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct)
            ?? throw new InvalidCredentialsException("refresh_token_invalid", "Refresh token is not valid.");

        if (existing.RevokedAtUtc is not null)
            throw new InvalidCredentialsException("refresh_token_revoked", "Refresh token has been revoked.");
        if (existing.ExpiresAtUtc <= now)
            throw new InvalidCredentialsException("refresh_token_expired", "Refresh token has expired.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == existing.UserId, ct)
            ?? throw new InvalidCredentialsException("refresh_token_invalid", "Refresh token is not valid.");

        var issued = _issuer.Issue(user);
        existing.RevokedAtUtc = now;
        existing.ReplacedByTokenId = issued.Token.Id;
        await _db.SaveChangesAsync(ct);

        return _issuer.ToSuccess(user, issued.Raw);
    }
}
