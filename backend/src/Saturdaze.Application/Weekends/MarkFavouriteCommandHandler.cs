using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;

namespace Saturdaze.Application.Weekends;

public sealed class MarkFavouriteCommandHandler : IRequestHandler<MarkFavouriteCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly IWeatherClient _weather;
    private readonly IOptions<HomeLocationOptions> _home;

    public MarkFavouriteCommandHandler(IAppDbContext db, IWeatherClient weather, IOptions<HomeLocationOptions> home)
    {
        _db = db;
        _weather = weather;
        _home = home;
    }

    public async Task<WeekendDto> Handle(MarkFavouriteCommand request, CancellationToken cancellationToken)
    {
        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(w => w.Id == request.WeekendId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Weekend), request.WeekendId);

        weekend.IsFavourite = request.Favourite;
        await _db.SaveChangesAsync(cancellationToken);

        var forecast = await _weather.GetForecastAsync(
            _home.Value.Latitude, _home.Value.Longitude,
            weekend.WeekendOf, weekend.WeekendOf.AddDays(1), cancellationToken);
        return WeekendMapper.ToDto(weekend, forecast);
    }
}
