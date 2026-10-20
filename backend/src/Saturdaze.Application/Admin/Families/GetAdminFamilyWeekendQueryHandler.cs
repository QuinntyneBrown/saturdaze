using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;
using Saturdaze.Application.Weekends;

namespace Saturdaze.Application.Admin.Families;

public sealed class GetAdminFamilyWeekendQueryHandler : IRequestHandler<GetAdminFamilyWeekendQuery, WeekendDto>
{
    public const string NotPlanned = "weekend_not_planned";

    private readonly IAppDbContext _db;
    private readonly AdminFamilyScope _scope;
    private readonly IDateTimeProvider _clock;
    private readonly WeekendForecastService _forecast;

    public GetAdminFamilyWeekendQueryHandler(
        IAppDbContext db, AdminFamilyScope scope, IDateTimeProvider clock, WeekendForecastService forecast)
    {
        _db = db;
        _scope = scope;
        _clock = clock;
        _forecast = forecast;
    }

    public async Task<WeekendDto> Handle(GetAdminFamilyWeekendQuery request, CancellationToken ct)
    {
        await _scope.EnterAsync(request.FamilyId, ct);
        var weekendOf = GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday(_clock.Today);

        // Unlike the family's own read (ADR-003), an administrator's read never plans.
        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .FirstOrDefaultAsync(w => w.FamilyId == request.FamilyId && w.WeekendOf == weekendOf, ct)
            ?? throw new NotFoundException($"{NotPlanned}: nothing is drafted for the weekend of {weekendOf:yyyy-MM-dd} yet.");

        var forecast = await _forecast.GetAsync(weekend.WeekendOf, ct);
        return WeekendMapper.ToDto(weekend, forecast);
    }
}
