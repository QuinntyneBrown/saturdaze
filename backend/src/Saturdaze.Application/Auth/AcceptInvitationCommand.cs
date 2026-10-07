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

/// <summary>The invitee chooses a password and joins the inviting family (L2-127).</summary>
public sealed record AcceptInvitationCommand(string Token, string Password) : IRequest<AuthSuccessDto>;

public sealed class AcceptInvitationCommandHandler : IRequestHandler<AcceptInvitationCommand, AuthSuccessDto>
{
    private readonly IAppDbContext _db;
    private readonly InvitationResolver _resolver;
    private readonly IPasswordHasher _hasher;
    private readonly IDateTimeProvider _clock;
    private readonly RefreshTokenIssuer _issuer;

    public AcceptInvitationCommandHandler(
        IAppDbContext db,
        InvitationResolver resolver,
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

    public async Task<AuthSuccessDto> Handle(AcceptInvitationCommand request, CancellationToken ct)
    {
        var invitation = await _resolver.ResolveAsync(request.Token, ct);
        if ((request.Password ?? string.Empty).Length < 8)
            throw new AuthFlowException(400, "weak_password", "Password must be at least 8 characters.");
        if (await _db.Users.AnyAsync(u => u.NormalizedEmail == invitation.NormalizedEmail, ct))
            throw new ConflictException("email_in_use", "An account with that email already exists.");

        var member = await _db.FamilyMembers.SingleAsync(m => m.Id == invitation.FamilyMemberId, ct);
        var now = _clock.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = invitation.Email,
            NormalizedEmail = invitation.NormalizedEmail,
            PasswordHash = _hasher.Hash(request.Password!),
            Role = UserRole.User,
            FamilyId = invitation.FamilyId,
            // Only the invited address could have received the link.
            EmailVerifiedUtc = now,
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };
        _db.Users.Add(user);
        member.UserId = user.Id;
        invitation.AcceptedAtUtc = now;

        var issued = _issuer.Issue(user);
        await _db.SaveChangesAsync(ct);

        return _issuer.ToSuccess(user, issued.Raw);
    }
}
