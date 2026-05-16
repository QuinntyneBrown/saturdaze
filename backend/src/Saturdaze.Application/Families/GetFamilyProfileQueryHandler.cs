using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;

namespace Saturdaze.Application.Families;

public sealed class GetFamilyProfileQueryHandler : IRequestHandler<GetFamilyProfileQuery, FamilyProfileDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;

    public GetFamilyProfileQueryHandler(IAppDbContext db, ICurrentFamilyAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task<FamilyProfileDto> Handle(GetFamilyProfileQuery request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        var family = await _db.Families
            .AsNoTracking()
            .Include(f => f.Members)
            .Include(f => f.Commitments)
            .Include(f => f.Preferences)
            .SingleOrDefaultAsync(f => f.Id == familyId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Family), familyId);

        return new FamilyProfileDto(
            family.Id,
            family.HomeLocation,
            family.BudgetEnabled,
            family.Members
                .OrderBy(m => m.Age)
                .Select(m => new FamilyMemberDto(m.Id, m.Name, m.Age))
                .ToList(),
            family.Commitments
                .OrderBy(c => ((int)c.DayOfWeek + 1) % 7) // Sat=0, Sun=1, Mon=2, ...
                .ThenBy(c => c.StartTime)
                .Select(c => new CommitmentDto(c.Id, c.Title, c.DayOfWeek, c.StartTime, c.EndTime))
                .ToList(),
            family.Preferences
                .OrderBy(p => p.Kind).ThenBy(p => p.Value)
                .Select(p => new PreferenceDto(p.Id, p.Kind, p.Value))
                .ToList());
    }
}
