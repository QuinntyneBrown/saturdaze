using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Auth;

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand, AuthTokenDeliveryDto>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _tokens;
    private readonly IDateTimeProvider _clock;

    public ForgotPasswordCommandHandler(IAppDbContext db, IJwtTokenService tokens, IDateTimeProvider clock)
    {
        _db = db;
        _tokens = tokens;
        _clock = clock;
    }

    public async Task<AuthTokenDeliveryDto> Handle(ForgotPasswordCommand request, CancellationToken ct)
    {
        var normalized = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalized, ct);
        if (user is null) return new AuthTokenDeliveryDto(null, null, null);

        var now = _clock.UtcNow;
        var raw = _tokens.CreateRawRefreshToken();
        var expires = now.AddMinutes(60);

        foreach (var existing in await _db.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.ConsumedAtUtc == null && t.ExpiresAtUtc > now)
            .ToListAsync(ct))
        {
            existing.ConsumedAtUtc = now;
        }

        _db.PasswordResetTokens.Add(new PasswordResetToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = _tokens.HashRefreshToken(raw),
            CreatedAtUtc = now,
            ExpiresAtUtc = expires,
        });

        await _db.SaveChangesAsync(ct);
        return new AuthTokenDeliveryDto(user.Email, raw, expires);
    }
}
