using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Errands;

public sealed class MarkErrandDoneCommandHandler : IRequestHandler<MarkErrandDoneCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly IWeatherClient _weather;
    private readonly IOptions<HomeLocationOptions> _home;

    public MarkErrandDoneCommandHandler(IAppDbContext db, IWeatherClient weather, IOptions<HomeLocationOptions> home)
    {
        _db = db;
        _weather = weather;
        _home = home;
    }

    public async Task<WeekendDto> Handle(MarkErrandDoneCommand request, CancellationToken cancellationToken)
    {
        var errand = await _db.ShoppingErrands.SingleOrDefaultAsync(e => e.Id == request.ErrandId, cancellationToken)
            ?? throw new NotFoundException(nameof(ShoppingErrand), request.ErrandId);
        errand.Done = request.Done;
        await _db.SaveChangesAsync(cancellationToken);

        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleAsync(w => w.Id == errand.WeekendId, cancellationToken);
        var forecast = await _weather.GetForecastAsync(
            _home.Value.Latitude, _home.Value.Longitude,
            weekend.WeekendOf, weekend.WeekendOf.AddDays(1), cancellationToken);
        return WeekendMapper.ToDto(weekend, forecast);
    }
}
