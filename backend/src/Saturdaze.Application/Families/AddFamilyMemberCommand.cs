using FluentValidation;
using MediatR;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Families;

/// <summary>The owner adds a member who will not sign in (L2-125).</summary>
public sealed record AddFamilyMemberCommand(string Name, int Age) : IRequest<AddFamilyMemberResultDto>;

public sealed class AddFamilyMemberCommandValidator : AbstractValidator<AddFamilyMemberCommand>
{
    public AddFamilyMemberCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Age).InclusiveBetween(0, 120);
    }
}

public sealed class AddFamilyMemberCommandHandler : IRequestHandler<AddFamilyMemberCommand, AddFamilyMemberResultDto>
{
    private readonly IAppDbContext _db;
    private readonly FamilyOwnership _ownership;

    public AddFamilyMemberCommandHandler(IAppDbContext db, FamilyOwnership ownership)
    {
        _db = db;
        _ownership = ownership;
    }

    public async Task<AddFamilyMemberResultDto> Handle(AddFamilyMemberCommand request, CancellationToken ct)
    {
        var family = await _ownership.EnsureOwnerAsync(ct);
        var name = request.Name.Trim();
        if (family.Members.Any(m => string.Equals(m.Name, name, StringComparison.OrdinalIgnoreCase)))
            throw new ConflictException("member_name_in_use", $"{name} is already in the family.");

        var member = new FamilyMember { Id = Guid.NewGuid(), FamilyId = family.Id, Name = name, Age = request.Age };
        _db.FamilyMembers.Add(member);
        await _db.SaveChangesAsync(ct);

        return new AddFamilyMemberResultDto(new FamilyMemberDto(member.Id, member.Name, member.Age), Invite: null);
    }
}
