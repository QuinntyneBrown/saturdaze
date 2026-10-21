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

/// <summary>
/// Sign in with Google (L2-163, ADR-019). Resolves the account in this order:
/// the one already linked to the Google subject; the one with the same email
/// when its address is verified (linked on the way through); otherwise a new
/// verified, password-less account owning a new family, as registration does.
/// </summary>
public class SignInWithGoogleCommandHandler : IRequestHandler<SignInWithGoogleCommand, AuthSuccessDto>
{
    private readonly IAppDbContext _db;
    private readonly IGoogleIdTokenVerifier _verifier;
    private readonly IDateTimeProvider _clock;
    private readonly RefreshTokenIssuer _issuer;

    public SignInWithGoogleCommandHandler(
        IAppDbContext db,
        IGoogleIdTokenVerifier verifier,
        IDateTimeProvider clock,
        RefreshTokenIssuer issuer)
    {
        _db = db;
        _verifier = verifier;
        _clock = clock;
        _issuer = issuer;
    }

    public async Task<AuthSuccessDto> Handle(SignInWithGoogleCommand request, CancellationToken ct)
    {
        if (!_verifier.IsConfigured)
        {
            throw new AuthFlowException(503, "google_not_configured", "Sign in with Google is not set up on this server.");
        }

        var identity = await _verifier.VerifyAsync(request.Credential, ct)
            ?? throw new AuthFlowException(401, "google_token_invalid", "Google did not vouch for that sign-in.");
        if (!identity.EmailVerified)
        {
            throw new AuthFlowException(401, "google_email_unverified", "Google has not verified that email address.");
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.GoogleSubject == identity.Subject, ct);
        if (user is null)
        {
            var normalized = identity.Email.Trim().ToLowerInvariant();
            user = await _db.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalized, ct);
            if (user is not null)
            {
                // Linking proves nothing about who registered the password account,
                // so only an account that verified its address is linked (ADR-019).
                if (user.EmailVerifiedUtc is null)
                {
                    throw new ConflictException("email_unverified",
                        "An account with that email exists but has not verified it. Sign in with its password to verify it first.");
                }
                user.GoogleSubject = identity.Subject;
                user.UpdatedAtUtc = _clock.UtcNow;
            }
            else
            {
                user = CreateAccount(identity, normalized);
            }
        }

        var issued = _issuer.Issue(user);
        await _db.SaveChangesAsync(ct);
        return _issuer.ToSuccess(user, issued.Raw);
    }

    private User CreateAccount(GoogleIdentity identity, string normalized)
    {
        var now = _clock.UtcNow;
        var userId = Guid.NewGuid();
        var family = new Family
        {
            Id = Guid.NewGuid(),
            OwnerUserId = userId,
            HomeLocation = string.Empty,
            BudgetEnabled = false,
            FridayPreviewEnabled = true,
        };
        _db.Families.Add(family);

        var user = new User
        {
            Id = userId,
            Email = identity.Email.Trim(),
            NormalizedEmail = normalized,
            PasswordHash = string.Empty,
            Role = UserRole.User,
            FamilyId = family.Id,
            EmailVerifiedUtc = now,
            GoogleSubject = identity.Subject,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };
        _db.Users.Add(user);
        return user;
    }
}
