using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;

namespace Saturdaze.Application.Auth;

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand, AuthSuccessDto>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _jwt;
    private readonly IDateTimeProvider _clock;
    private readonly RefreshTokenIssuer _issuer;

    public ResetPasswordCommandHandler(
        IAppDbContext db,
        IPasswordHasher hasher,
        IJwtTokenService jwt,
        IDateTimeProvider clock,
        RefreshTokenIssuer issuer)
    {
        _db = db;
        _hasher = hasher;
        _jwt = jwt;
        _clock = clock;
        _issuer = issuer;
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

        // A password reset ends every other session (L2-005).
        await _issuer.RevokeAllActiveAsync(user.Id, now, ct);
        var issued = _issuer.Issue(user);

        await _db.SaveChangesAsync(ct);

        return _issuer.ToSuccess(user, issued.Raw);
    }
}
