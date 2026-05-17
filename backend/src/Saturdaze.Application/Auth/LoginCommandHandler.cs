using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Auth;

public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthSuccessDto>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _clock;

    public LoginCommandHandler(
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

    public async Task<AuthSuccessDto> Handle(LoginCommand request, CancellationToken ct)
    {
        var normalized = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalized, ct);
        if (user is null || !_hasher.Verify(user.PasswordHash, request.Password))
        {
            // Same exception in both branches so the response never leaks
            // whether the email exists.
            throw new InvalidCredentialsException();
        }

        var now = _clock.UtcNow;
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
