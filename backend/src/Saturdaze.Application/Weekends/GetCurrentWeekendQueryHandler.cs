using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Weather;

namespace Saturdaze.Application.Weekends;

public sealed class GetCurrentWeekendQueryHandler : IRequestHandler<GetCurrentWeekendQuery, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IDateTimeProvider _clock;
    private readonly WeekendForecastService _forecast;
    private readonly ISender _mediator;

    public GetCurrentWeekendQueryHandler(
        IAppDbContext db,
        ICurrentFamilyAccessor current,
        IDateTimeProvider clock,
        WeekendForecastService forecast,
        ISender mediator)
    {
        _db = db;
        _current = current;
        _clock = clock;
        _forecast = forecast;
        _mediator = mediator;
    }

    public async Task<WeekendDto> Handle(GetCurrentWeekendQuery request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);
        var weekendOf = ResolveUpcomingSaturday(_clock.Today);

        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .FirstOrDefaultAsync(w => w.FamilyId == familyId && w.WeekendOf == weekendOf, cancellationToken);

        if (weekend is null)
        {
            // First-load materialisation: plan the upcoming weekend on demand so
            // the Home page always has something to render on a fresh database.
            // Idempotent — GenerateWeekendCommandHandler returns the existing
            // weekend if another request raced ahead.
            return await _mediator.Send(new GenerateWeekendCommand(weekendOf), cancellationToken);
        }

        var forecast = await _forecast.GetAsync(weekend.WeekendOf, cancellationToken);
        return WeekendMapper.ToDto(weekend, forecast);
    }

    /// <summary>Saturday itself, the Saturday of a Sunday, or the next Saturday on a weekday.</summary>
    public static DateOnly ResolveUpcomingSaturday(DateOnly today)
    {
        return today.DayOfWeek switch
        {
            DayOfWeek.Saturday => today,
            DayOfWeek.Sunday => today.AddDays(-1),
            _ => today.AddDays((int)DayOfWeek.Saturday - (int)today.DayOfWeek)
        };
    }
}
