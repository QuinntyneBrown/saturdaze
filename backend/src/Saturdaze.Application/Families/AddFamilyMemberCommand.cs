using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Families;

/// <summary>
/// The owner adds a member: without <see cref="Email"/> they never sign in
/// (L2-125); with it they are invited to (L2-126).
/// </summary>
public sealed record AddFamilyMemberCommand(string Name, int Age, string? Email = null) : IRequest<AddFamilyMemberResultDto>;

public sealed class AddFamilyMemberCommandValidator : AbstractValidator<AddFamilyMemberCommand>
{
    public AddFamilyMemberCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Age).InclusiveBetween(0, 120);
        RuleFor(x => x.Email!).EmailAddress().MaximumLength(256).When(x => !string.IsNullOrWhiteSpace(x.Email));
    }
}

public sealed class AddFamilyMemberCommandHandler : IRequestHandler<AddFamilyMemberCommand, AddFamilyMemberResultDto>
{
    public static readonly TimeSpan InvitationLifetime = TimeSpan.FromDays(7);

    private readonly IAppDbContext _db;
    private readonly FamilyOwnership _ownership;
    private readonly IJwtTokenService _tokens;
    private readonly ICurrentUserAccessor _user;
    private readonly IDateTimeProvider _clock;

    public AddFamilyMemberCommandHandler(
        IAppDbContext db,
        FamilyOwnership ownership,
        IJwtTokenService tokens,
        ICurrentUserAccessor user,
        IDateTimeProvider clock)
    {
        _db = db;
        _ownership = ownership;
        _tokens = tokens;
        _user = user;
        _clock = clock;
    }

    public async Task<AddFamilyMemberResultDto> Handle(AddFamilyMemberCommand request, CancellationToken ct)
    {
        var family = await _ownership.EnsureOwnerAsync(ct);
        var name = request.Name.Trim();
        if (family.Members.Any(m => string.Equals(m.Name, name, StringComparison.OrdinalIgnoreCase)))
            throw new ConflictException("member_name_in_use", $"{name} is already in the family.");

        var member = new FamilyMember { Id = Guid.NewGuid(), FamilyId = family.Id, Name = name, Age = request.Age };
        _db.FamilyMembers.Add(member);

        FamilyInviteDto? invite = null;
        if (!string.IsNullOrWhiteSpace(request.Email))
            invite = await InviteAsync(family, member, request.Email.Trim(), ct);

        await _db.SaveChangesAsync(ct);

        var dto = invite is null
            ? new FamilyMemberDto(member.Id, member.Name, member.Age)
            : new FamilyMemberDto(member.Id, member.Name, member.Age, MemberAccess.Invited, invite.Email);
        return new AddFamilyMemberResultDto(dto, invite);
    }

    private async Task<FamilyInviteDto> InviteAsync(Family family, FamilyMember member, string email, CancellationToken ct)
    {
        var normalized = email.ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.NormalizedEmail == normalized, ct))
            throw new ConflictException("email_in_use", "That email already signs in to Saturdaze.");
        if (await _db.FamilyInvitations.AnyAsync(
                i => i.FamilyId == family.Id && i.NormalizedEmail == normalized && i.AcceptedAtUtc == null, ct))
            throw new ConflictException("already_invited", "That email already has an invite to this family.");

        var now = _clock.UtcNow;
        var raw = _tokens.CreateRawRefreshToken();
        var invitation = new FamilyInvitation
        {
            Id = Guid.NewGuid(),
            FamilyId = family.Id,
            FamilyMemberId = member.Id,
            Email = email,
            NormalizedEmail = normalized,
            TokenHash = _tokens.HashRefreshToken(raw),
            InvitedByUserId = _user.UserId ?? Guid.Empty,
            CreatedAtUtc = now,
            ExpiresAtUtc = now.Add(InvitationLifetime),
        };
        _db.FamilyInvitations.Add(invitation);

        // Relative: the API makes it absolute against the app's origin.
        return new FamilyInviteDto(email, raw, $"/accept-invite?token={Uri.EscapeDataString(raw)}", invitation.ExpiresAtUtc);
    }
}
