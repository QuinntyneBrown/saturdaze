using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Auth;

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, AuthSuccessDto>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _clock;

    public ResetPasswordCommandHandler(
        IAppDbContext db,
        IPasswordHasher hasher,
        IJwtTokenService jwt,
        IDateTimeProvider clock)
    {
        _db = db;
        _hasher = hasher;
        _jwt = jwt;
        _clock = clock;
    }

    public async Task<AuthSuccessDto> Handle(ResetPasswordCommand request, CancellationToken ct)
    {
        if (request.Password.Length < 8)
            throw new AuthFlowException(400, "weak_password", "Password must be at least 8 characters.");

        var now = _clock.UtcNow;
        var hash = _jwt.HashRefreshToken(request.Token);
        var token = await _db.PasswordResetTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct)
            ?? throw new AuthFlowException(400, "token_invalid", "Reset link is invalid.");

        if (token.ConsumedAtUtc is not null)
            throw new AuthFlowException(400, "token_invalid", "Reset link has already been used.");
        if (token.ExpiresAtUtc <= now)
            throw new AuthFlowException(400, "token_expired", "Reset link has expired.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == token.UserId, ct)
            ?? throw new AuthFlowException(400, "token_invalid", "Reset link is invalid.");

        token.ConsumedAtUtc = now;
        user.PasswordHash = _hasher.Hash(request.Password);
        user.UpdatedAtUtc = now;

        foreach (var refresh in await _db.RefreshTokens
            .Where(t => t.UserId == user.Id && t.RevokedAtUtc == null)
            .ToListAsync(ct))
        {
            refresh.RevokedAtUtc = now;
        }

        var refreshRaw = _jwt.CreateRawRefreshToken();
        _db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = _jwt.HashRefreshToken(refreshRaw),
            ExpiresAtUtc = now.AddDays(14),
            CreatedAtUtc = now,
        });

        await _db.SaveChangesAsync(ct);

        return new AuthSuccessDto(
            new AuthTokensDto(_jwt.CreateAccessToken(user), refreshRaw, _jwt.AccessTokenExpiresAt),
            new UserDto(user.Id, user.Email, user.Role, user.EmailVerifiedUtc)
        );
    }
}
