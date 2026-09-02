using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Auth;

public sealed record IssuedRefreshToken(RefreshToken Token, string Raw);

/// <summary>
/// Single place that mints refresh-token rows and the matching
/// <see cref="AuthSuccessDto"/>. Login, register, reset-password and refresh
/// all issue through here so lifetime, hashing and IP capture stay identical.
/// Callers own <c>SaveChangesAsync</c>.
/// </summary>
public sealed class RefreshTokenIssuer
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromDays(14);

    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _clock;
    private readonly ICurrentUserAccessor _current;

    public RefreshTokenIssuer(
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

    /// <summary>Adds (does not save) a fresh refresh-token row for the user.</summary>
    public IssuedRefreshToken Issue(User user)
    {
        var now = _clock.UtcNow;
        var raw = _jwt.CreateRawRefreshToken();
        var token = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = _jwt.HashRefreshToken(raw),
            CreatedAtUtc = now,
            ExpiresAtUtc = now.Add(Lifetime),
            CreatedByIp = _current.IpAddress,
        };
        _db.RefreshTokens.Add(token);
        return new IssuedRefreshToken(token, raw);
    }

    public AuthSuccessDto ToSuccess(User user, string rawRefreshToken) => new(
        new AuthTokensDto(_jwt.CreateAccessToken(user), rawRefreshToken, _jwt.AccessTokenExpiresAt),
        new UserDto(user.Id, user.Email, user.Role, user.EmailVerifiedUtc));

    /// <summary>Marks every live token for the user as revoked (does not save).</summary>
    public async Task RevokeAllActiveAsync(Guid userId, DateTimeOffset now, CancellationToken ct)
    {
        var active = await _db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAtUtc == null)
            .ToListAsync(ct);
        foreach (var token in active)
            token.RevokedAtUtc = now;
    }
}
