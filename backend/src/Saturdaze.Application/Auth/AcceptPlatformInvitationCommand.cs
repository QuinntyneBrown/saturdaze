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
/// The invitee chooses a password and joins Saturdaze (L2-161): a verified
/// account that owns a new empty family, as registration does, with no
/// verification mail because the link proved the address.
/// </summary>
public sealed record AcceptPlatformInvitationCommand(string Token, string Password) : IRequest<AuthSuccessDto>;

public sealed class AcceptPlatformInvitationCommandHandler : IRequestHandler<AcceptPlatformInvitationCommand, AuthSuccessDto>
{
    private readonly IAppDbContext _db;
    private readonly PlatformInvitationResolver _resolver;
    private readonly IPasswordHasher _hasher;
    private readonly IDateTimeProvider _clock;
    private readonly RefreshTokenIssuer _issuer;

    public AcceptPlatformInvitationCommandHandler(
        IAppDbContext db,
        PlatformInvitationResolver resolver,
        IPasswordHasher hasher,
        IDateTimeProvider clock,
        RefreshTokenIssuer issuer)
    {
        _db = db;
        _resolver = resolver;
        _hasher = hasher;
        _clock = clock;
        _issuer = issuer;
    }

    public async Task<AuthSuccessDto> Handle(AcceptPlatformInvitationCommand request, CancellationToken ct)
    {
        var invitation = await _resolver.ResolveAsync(request.Token, ct);
        PasswordPolicy.Enforce(request.Password);
        if (await _db.Users.AnyAsync(u => u.NormalizedEmail == invitation.NormalizedEmail, ct))
            throw new ConflictException("email_in_use", "An account with that email already exists.");

        var now = _clock.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = invitation.Email,
            NormalizedEmail = invitation.NormalizedEmail,
            PasswordHash = _hasher.Hash(request.Password),
            Role = UserRole.User,
            // Only the invited address could have received the link.
            EmailVerifiedUtc = now,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };
        _db.Users.Add(user);

        user.FamilyId = await PlaceInFamilyAsync(invitation, user, ct);

        invitation.AcceptedAtUtc = now;
        invitation.AcceptedUserId = user.Id;

        var issued = _issuer.Issue(user);
        await _db.SaveChangesAsync(ct);

        return _issuer.ToSuccess(user, issued.Raw);
    }

    /// <summary>
    /// The prospect's family when the invitation carries one: owned by the
    /// first invitee to accept, joined by any later one (L2-161 AC3, AC5).
    /// Otherwise a new empty family the account owns (AC4).
    /// </summary>
    private async Task<Guid> PlaceInFamilyAsync(PlatformInvitation invitation, User user, CancellationToken ct)
    {
        if (invitation.ProspectId is { } prospectId)
        {
            var prospect = await _db.Prospects.SingleAsync(p => p.Id == prospectId, ct);
            if (prospect.ClaimedByUserId is null)
            {
                var claimed = await _db.Families.SingleAsync(f => f.Id == prospect.FamilyId, ct);
                claimed.OwnerUserId = user.Id;
                prospect.ClaimedByUserId = user.Id;
                prospect.ClaimedAtUtc = _clock.UtcNow;
            }
            return prospect.FamilyId;
        }

        var family = new Family
        {
            Id = Guid.NewGuid(),
            OwnerUserId = user.Id,
            HomeLocation = string.Empty,
            BudgetEnabled = false,
            FridayPreviewEnabled = true,
        };
        _db.Families.Add(family);
        return family.Id;
    }
}
