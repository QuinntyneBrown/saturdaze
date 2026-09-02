using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;

namespace Saturdaze.Application.Auth;

public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthSuccessDto>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly RefreshTokenIssuer _issuer;

    public LoginCommandHandler(IAppDbContext db, IPasswordHasher hasher, RefreshTokenIssuer issuer)
    {
        _db = db;
        _hasher = hasher;
        _issuer = issuer;
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

        // Multi-session by design: an earlier login's refresh token stays
        // valid until it is used, revoked, or expires (L2-033 AC1).
        var issued = _issuer.Issue(user);
        await _db.SaveChangesAsync(ct);

        return _issuer.ToSuccess(user, issued.Raw);
    }
}
