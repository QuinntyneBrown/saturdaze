using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Families;

/// <summary>
/// "This is me": the owner links a listed member to their own account
/// (L2-216). Only a member with no account and no outstanding invitation can
/// be claimed; an invited member is theirs to accept (ADR-024).
/// </summary>
public sealed record ClaimFamilyMemberCommand(Guid Id) : IRequest<FamilyMemberDto>;

public sealed class ClaimFamilyMemberCommandHandler : IRequestHandler<ClaimFamilyMemberCommand, FamilyMemberDto>
{
    private readonly IAppDbContext _db;
    private readonly FamilyOwnership _ownership;
    private readonly ICurrentUserAccessor _user;

    public ClaimFamilyMemberCommandHandler(IAppDbContext db, FamilyOwnership ownership, ICurrentUserAccessor user)
    {
        _db = db;
        _ownership = ownership;
        _user = user;
    }

    public async Task<FamilyMemberDto> Handle(ClaimFamilyMemberCommand request, CancellationToken ct)
    {
        var family = await _ownership.EnsureOwnerAsync(ct);
        var member = family.Members.SingleOrDefault(m => m.Id == request.Id)
            ?? throw new NotFoundException(nameof(FamilyMember), request.Id);
        var caller = FamilyOwnership.EnsureNotYetInFamily(family, _user.UserId);

        var invited = await _db.FamilyInvitations
            .AnyAsync(i => i.FamilyMemberId == member.Id && i.AcceptedAtUtc == null, ct);
        if (member.UserId is not null || invited)
            throw new ConflictException("member_has_access", $"{member.Name} is already invited or signs in.");

        member.UserId = caller;
        await _db.SaveChangesAsync(ct);

        var email = await _db.Users.AsNoTracking().Where(u => u.Id == caller).Select(u => u.Email).SingleAsync(ct);
        return new FamilyMemberDto(member.Id, member.Name, member.Age, MemberAccess.Account, email);
    }
}
