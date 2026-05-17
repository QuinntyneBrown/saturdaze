using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Auth;

public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, AuthSuccessDto>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _clock;

    public RegisterUserCommandHandler(
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

    public async Task<AuthSuccessDto> Handle(RegisterUserCommand request, CancellationToken ct)
    {
        var normalized = request.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.NormalizedEmail == normalized, ct))
        {
            throw new ConflictException("email_in_use", "An account with that email already exists.");
        }

        var now = _clock.UtcNow;

        // Per D9: create a Family for every new user. The first sign-in flow
        // routes them to /profile to populate it with members + commitments.
        var family = new Family
        {
            Id = Guid.NewGuid(),
            HomeLocation = request.HomeLocation ?? string.Empty,
            BudgetEnabled = false,
        };
        _db.Families.Add(family);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.Trim(),
            NormalizedEmail = normalized,
            PasswordHash = _hasher.Hash(request.Password),
            Role = UserRole.User,
            FamilyId = family.Id,
            EmailVerifiedUtc = null,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };
        _db.Users.Add(user);

        var refreshRaw = _jwt.CreateRawRefreshToken();
        var refresh = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = _jwt.HashRefreshToken(refreshRaw),
            ExpiresAtUtc = now.AddDays(14),
            CreatedAtUtc = now,
        };
        _db.RefreshTokens.Add(refresh);

        var verifyRaw = _jwt.CreateRawRefreshToken();
        _db.EmailVerificationTokens.Add(new EmailVerificationToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = _jwt.HashRefreshToken(verifyRaw),
            ExpiresAtUtc = now.AddHours(24),
            CreatedAtUtc = now,
        });

        await _db.SaveChangesAsync(ct);

        return new AuthSuccessDto(
            new AuthTokensDto(_jwt.CreateAccessToken(user), refreshRaw, _jwt.AccessTokenExpiresAt),
            new UserDto(user.Id, user.Email, user.Role, user.EmailVerifiedUtc)
        );
    }
}
