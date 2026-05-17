using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Families;

public sealed class SaveFamilyProfileCommandHandler : IRequestHandler<SaveFamilyProfileCommand, FamilyProfileDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IMediator _mediator;

    public SaveFamilyProfileCommandHandler(IAppDbContext db, ICurrentFamilyAccessor current, IMediator mediator)
    {
        _db = db;
        _current = current;
        _mediator = mediator;
    }

    public async Task<FamilyProfileDto> Handle(SaveFamilyProfileCommand request, CancellationToken cancellationToken)
    {
        Guid familyId;
        Family? family = null;
        try
        {
            familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);
            family = await _db.Families
                .Include(f => f.Members)
                .Include(f => f.Commitments)
                .Include(f => f.Preferences)
                .SingleOrDefaultAsync(f => f.Id == familyId, cancellationToken);
        }
        catch (Application.Exceptions.NotFoundException)
        {
            // First-time setup: no family exists yet.
        }

        if (family is null)
        {
            family = new Family { Id = Guid.NewGuid() };
            _db.Families.Add(family);
        }

        family.HomeLocation = request.HomeLocation;
        family.BudgetEnabled = request.BudgetEnabled;

        SyncMembers(family, request.Members);
        SyncCommitments(family, request.Commitments);
        SyncPreferences(family, request.Preferences);

        await _db.SaveChangesAsync(cancellationToken);

        return await _mediator.Send(new GetFamilyProfileQuery(), cancellationToken);
    }

    private void SyncMembers(Family family, IReadOnlyList<SaveMemberInput> inputs)
    {
        var byName = family.Members.ToDictionary(m => m.Name, StringComparer.OrdinalIgnoreCase);
        var keepNames = new HashSet<string>(inputs.Select(i => i.Name), StringComparer.OrdinalIgnoreCase);

        foreach (var member in family.Members.Where(m => !keepNames.Contains(m.Name)).ToList())
            _db.FamilyMembers.Remove(member);

        foreach (var input in inputs)
        {
            if (byName.TryGetValue(input.Name, out var member))
            {
                member.Age = input.Age;
            }
            else
            {
                _db.FamilyMembers.Add(new FamilyMember
                {
                    Id = Guid.NewGuid(),
                    FamilyId = family.Id,
                    Name = input.Name,
                    Age = input.Age
                });
            }
        }
    }

    private void SyncCommitments(Family family, IReadOnlyList<SaveCommitmentInput> inputs)
    {
        var byKey = family.Commitments.ToDictionary(c => (c.Title.ToLowerInvariant(), c.DayOfWeek));
        var keepKeys = new HashSet<(string, DayOfWeek)>(inputs.Select(i => (i.Title.ToLowerInvariant(), i.DayOfWeek)));

        foreach (var commitment in family.Commitments.Where(c => !keepKeys.Contains((c.Title.ToLowerInvariant(), c.DayOfWeek))).ToList())
            _db.Commitments.Remove(commitment);

        foreach (var input in inputs)
        {
            if (byKey.TryGetValue((input.Title.ToLowerInvariant(), input.DayOfWeek), out var commitment))
            {
                commitment.StartTime = input.StartTime;
                commitment.EndTime = input.EndTime;
                commitment.Title = input.Title;
            }
            else
            {
                _db.Commitments.Add(new Commitment
                {
                    Id = Guid.NewGuid(),
                    FamilyId = family.Id,
                    Title = input.Title,
                    DayOfWeek = input.DayOfWeek,
                    StartTime = input.StartTime,
                    EndTime = input.EndTime
                });
            }
        }
    }

    private void SyncPreferences(Family family, IReadOnlyList<SavePreferenceInput> inputs)
    {
        var byKey = family.Preferences.ToDictionary(p => (p.Kind, p.Value.ToLowerInvariant()));
        var keepKeys = new HashSet<(Domain.Enums.PreferenceKind, string)>(
            inputs.Select(i => (i.Kind, i.Value.ToLowerInvariant())));

        foreach (var pref in family.Preferences.Where(p => !keepKeys.Contains((p.Kind, p.Value.ToLowerInvariant()))).ToList())
            _db.Preferences.Remove(pref);

        foreach (var input in inputs)
        {
            if (!byKey.ContainsKey((input.Kind, input.Value.ToLowerInvariant())))
            {
                _db.Preferences.Add(new Saturdaze.Domain.Entities.Preference
                {
                    Id = Guid.NewGuid(),
                    FamilyId = family.Id,
                    Kind = input.Kind,
                    Value = input.Value
                });
            }
        }
    }
}
