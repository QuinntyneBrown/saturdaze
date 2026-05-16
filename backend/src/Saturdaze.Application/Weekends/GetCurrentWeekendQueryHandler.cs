using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;

namespace Saturdaze.Application.Weekends;

public sealed class GetCurrentWeekendQueryHandler : IRequestHandler<GetCurrentWeekendQuery, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IDateTimeProvider _clock;
    private readonly IWeatherClient _weather;
    private readonly IOptions<HomeLocationOptions> _home;

    public GetCurrentWeekendQueryHandler(
        IAppDbContext db,
        ICurrentFamilyAccessor current,
        IDateTimeProvider clock,
        IWeatherClient weather,
        IOptions<HomeLocationOptions> home)
    {
        _db = db;
        _current = current;
        _clock = clock;
        _weather = weather;
        _home = home;
    }

    public async Task<WeekendDto> Handle(GetCurrentWeekendQuery request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);
        var weekendOf = ResolveUpcomingSaturday(_clock.Today);

        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .FirstOrDefaultAsync(w => w.FamilyId == familyId && w.WeekendOf == weekendOf, cancellationToken)
            ?? throw new NotFoundException(
                $"No weekend planned for {weekendOf:yyyy-MM-dd}. POST /api/weekends/plan to create one.");

        var forecast = await _weather.GetForecastAsync(
            _home.Value.Latitude, _home.Value.Longitude,
            weekend.WeekendOf, weekend.WeekendOf.AddDays(1), cancellationToken);

        return WeekendMapper.ToDto(weekend, forecast);
    }

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
