using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;

namespace Saturdaze.Application.Auth;

public class VerifyEmailCommandHandler : IRequestHandler<VerifyEmailCommand, UserDto>
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _tokens;
    private readonly IDateTimeProvider _clock;

    public VerifyEmailCommandHandler(IAppDbContext db, IJwtTokenService tokens, IDateTimeProvider clock)
    {
        _db = db;
        _tokens = tokens;
        _clock = clock;
    }

    public async Task<UserDto> Handle(VerifyEmailCommand request, CancellationToken ct)
    {
        var now = _clock.UtcNow;
        var hash = _tokens.HashRefreshToken(request.Token);
        var token = await _db.EmailVerificationTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct)
            ?? throw new AuthFlowException(400, "token_invalid", "Verification link is invalid.");

        if (token.ConsumedAtUtc is not null)
            throw new AuthFlowException(400, "token_invalid", "Verification link has already been used.");
        if (token.ExpiresAtUtc <= now)
            throw new AuthFlowException(400, "token_expired", "Verification link has expired.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == token.UserId, ct)
            ?? throw new AuthFlowException(400, "token_invalid", "Verification link is invalid.");

        token.ConsumedAtUtc = now;
        user.EmailVerifiedUtc ??= now;
        user.UpdatedAtUtc = now;
        await _db.SaveChangesAsync(ct);

        return new UserDto(user.Id, user.Email, user.Role, user.EmailVerifiedUtc);
    }
}
