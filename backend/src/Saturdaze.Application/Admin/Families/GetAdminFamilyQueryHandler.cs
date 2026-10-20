using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Admin.Families;

public sealed class GetAdminFamilyQueryHandler : IRequestHandler<GetAdminFamilyQuery, AdminFamilyDetailDto>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;

    public GetAdminFamilyQueryHandler(IAppDbContext db, IDateTimeProvider clock)
    {
        _db = db;
        _clock = clock;
    }

    public async Task<AdminFamilyDetailDto> Handle(GetAdminFamilyQuery request, CancellationToken ct)
    {
        var family = await _db.Families.AsNoTracking()
            .Include(f => f.Members)
            .Include(f => f.Commitments)
            .SingleOrDefaultAsync(f => f.Id == request.FamilyId, ct)
            ?? throw new NotFoundException(nameof(Family), request.FamilyId);

        var accounts = await _db.Users.AsNoTracking().Where(u => u.FamilyId == family.Id).ToListAsync(ct);
        var upcoming = GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday(_clock.Today);
        var weekend = await _db.Weekends.AsNoTracking()
            .Where(w => w.FamilyId == family.Id && w.WeekendOf == upcoming)
            .Select(w => new AdminWeekendSummaryDto(
                w.Id, w.WeekendOf, w.Title, w.Blocks.Count, w.Blocks.Count(b => b.IsLocked), w.RegenerateCount))
            .FirstOrDefaultAsync(ct);

        return new AdminFamilyDetailDto(
            ListAdminFamiliesQueryHandler.ToDto(family, accounts, weekend),
            upcoming,
            family.Members.OrderBy(m => m.Name).Select(m => new FamilyMemberDto(m.Id, m.Name, m.Age)).ToList(),
            family.Commitments.OrderBy(c => c.DayOfWeek).ThenBy(c => c.StartTime)
                .Select(c => new CommitmentDto(c.Id, c.Title, c.DayOfWeek, c.StartTime, c.EndTime)).ToList());
    }
}
