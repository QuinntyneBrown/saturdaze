using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;

namespace Saturdaze.Application.Auth;

/// <summary>
/// Revokes a refresh token on sign-out (L2-003). Unknown or already-revoked
/// tokens are ignored so the endpoint never leaks token existence, and a
/// caller who presents a bearer cannot revoke another user's token.
/// </summary>
public sealed class RevokeRefreshTokenCommandHandler : IRequestHandler<RevokeRefreshTokenCommand>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _clock;
    private readonly ICurrentUserAccessor _current;

    public RevokeRefreshTokenCommandHandler(
        IAppDbContext db,
        IJwtTokenService jwt,
        IDateTimeProvider clock,
        ICurrentUserAccessor current)
    {
        _db = db;
        _jwt = jwt;
        _clock = clock;
        _current = current;
    }

    public async Task Handle(RevokeRefreshTokenCommand request, CancellationToken ct)
    {
        var hash = _jwt.HashRefreshToken(request.RefreshToken);
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (token is null || token.RevokedAtUtc is not null) return;
        if (_current.UserId is { } callerId && token.UserId != callerId) return;

        token.RevokedAtUtc = _clock.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
