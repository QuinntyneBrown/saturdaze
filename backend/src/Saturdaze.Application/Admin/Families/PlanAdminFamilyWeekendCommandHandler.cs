using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Families;

public sealed class PlanAdminFamilyWeekendCommandHandler : IRequestHandler<PlanAdminFamilyWeekendCommand, WeekendDto>
{
    private readonly AdminFamilyScope _scope;
    private readonly IDateTimeProvider _clock;
    private readonly ISender _sender;
    private readonly WeekendAuditWriter _audit;
    private readonly IAppDbContext _db;

    public PlanAdminFamilyWeekendCommandHandler(
        AdminFamilyScope scope, IDateTimeProvider clock, ISender sender, WeekendAuditWriter audit, IAppDbContext db)
    {
        _scope = scope;
        _clock = clock;
        _sender = sender;
        _audit = audit;
        _db = db;
    }

    public async Task<WeekendDto> Handle(PlanAdminFamilyWeekendCommand request, CancellationToken ct)
    {
        await _scope.EnterAsync(request.FamilyId, ct);
        var weekendOf = GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday(_clock.Today);
        var existed = await _db.Weekends.AsNoTracking()
            .AnyAsync(w => w.FamilyId == request.FamilyId && w.WeekendOf == weekendOf, ct);
        var weekend = await _sender.Send(new GenerateWeekendCommand(weekendOf), ct);
        // Re-posting returns the existing weekend (ADR-003); only a new plan is a change (L2-161).
        if (!existed)
        {
            _audit.Write(request.FamilyId, weekend, WeekendAuditAction.Plan, after: WeekendAuditWriter.Count(weekend));
            await _db.SaveChangesAsync(ct);
        }
        return weekend;
    }
}
