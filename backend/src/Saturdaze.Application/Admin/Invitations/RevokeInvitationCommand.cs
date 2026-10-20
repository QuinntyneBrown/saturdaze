using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Admin.Invitations;

/// <summary>Stops a pending invitation's link from working (L2-158). Idempotent once revoked.</summary>
public sealed record RevokeInvitationCommand(Guid Id) : IRequest;

public sealed class RevokeInvitationCommandHandler : IRequestHandler<RevokeInvitationCommand>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;

    public RevokeInvitationCommandHandler(IAppDbContext db, IDateTimeProvider clock)
    {
        _db = db;
        _clock = clock;
    }

    public async Task Handle(RevokeInvitationCommand request, CancellationToken ct)
    {
        var invitation = await _db.PlatformInvitations.FirstOrDefaultAsync(i => i.Id == request.Id, ct)
            ?? throw new NotFoundException(nameof(PlatformInvitation), request.Id);
        if (invitation.AcceptedAtUtc is not null)
            throw new ConflictException("already_accepted", "That invite was already accepted; the account exists.");
        if (invitation.RevokedAtUtc is not null) return;

        invitation.RevokedAtUtc = _clock.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
