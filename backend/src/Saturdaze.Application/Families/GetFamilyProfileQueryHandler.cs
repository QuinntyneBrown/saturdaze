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

        return FamilyProfileMapper.ToDto(family);
    }
}
