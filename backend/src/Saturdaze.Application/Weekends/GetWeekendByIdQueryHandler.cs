using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;

namespace Saturdaze.Application.Weekends;

public sealed class GetWeekendByIdQueryHandler : IRequestHandler<GetWeekendByIdQuery, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly IWeatherClient _weather;
    private readonly IOptions<HomeLocationOptions> _home;

    public GetWeekendByIdQueryHandler(IAppDbContext db, IWeatherClient weather, IOptions<HomeLocationOptions> home)
    {
        _db = db;
        _weather = weather;
        _home = home;
    }

    public async Task<WeekendDto> Handle(GetWeekendByIdQuery request, CancellationToken cancellationToken)
    {
        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .FirstOrDefaultAsync(w => w.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Weekend), request.Id);

        var forecast = await _weather.GetForecastAsync(
            _home.Value.Latitude, _home.Value.Longitude,
            weekend.WeekendOf, weekend.WeekendOf.AddDays(1), cancellationToken);

        return WeekendMapper.ToDto(weekend, forecast);
    }
}
