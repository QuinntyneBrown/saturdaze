using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Families;

/// <summary>
/// The owner removes a member (L2-128). The member's invitation cascades; an
/// account the member signs in with is deleted with its sessions (ADR-016).
/// </summary>
public sealed record RemoveFamilyMemberCommand(Guid Id) : IRequest;

public sealed class RemoveFamilyMemberCommandHandler : IRequestHandler<RemoveFamilyMemberCommand>
{
    private readonly IAppDbContext _db;
    private readonly FamilyOwnership _ownership;

    public RemoveFamilyMemberCommandHandler(IAppDbContext db, FamilyOwnership ownership)
    {
        _db = db;
        _ownership = ownership;
    }

    public async Task Handle(RemoveFamilyMemberCommand request, CancellationToken ct)
    {
        var family = await _ownership.EnsureOwnerAsync(ct);
        var member = family.Members.SingleOrDefault(m => m.Id == request.Id)
            ?? throw new NotFoundException(nameof(FamilyMember), request.Id);

        if (member.UserId is { } userId)
        {
            if (userId == family.OwnerUserId)
                throw new ConflictException("cannot_remove_owner", "The family's owner can't be removed.");

            var account = await _db.Users.SingleOrDefaultAsync(u => u.Id == userId, ct);
            if (account is not null) _db.Users.Remove(account);
        }

        _db.FamilyMembers.Remove(member);
        await _db.SaveChangesAsync(ct);
    }
}
