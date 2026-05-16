using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;
using Saturdaze.Application.Weekends;

namespace Saturdaze.Application.Blocks;

public sealed class LockBlockCommandHandler : IRequestHandler<LockBlockCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly IWeatherClient _weather;
    private readonly IOptions<HomeLocationOptions> _home;

    public LockBlockCommandHandler(IAppDbContext db, IWeatherClient weather, IOptions<HomeLocationOptions> home)
    {
        _db = db;
        _weather = weather;
        _home = home;
    }

    public async Task<WeekendDto> Handle(LockBlockCommand request, CancellationToken cancellationToken)
    {
        var block = await _db.ItineraryBlocks.SingleOrDefaultAsync(b => b.Id == request.BlockId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.ItineraryBlock), request.BlockId);
        block.IsLocked = request.Locked;
        await _db.SaveChangesAsync(cancellationToken);

        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleAsync(w => w.Id == block.WeekendId, cancellationToken);
        var forecast = await _weather.GetForecastAsync(
            _home.Value.Latitude, _home.Value.Longitude,
            weekend.WeekendOf, weekend.WeekendOf.AddDays(1), cancellationToken);

        return InternalWeekendMapper.ToDto(weekend, forecast);
    }
}

// Local re-export of WeekendMapper (which is internal) so the block handlers can share it.
internal static class InternalWeekendMapper
{
    public static WeekendDto ToDto(Domain.Entities.Weekend w, IReadOnlyList<WeatherForecast> f)
        => WeekendMapper.ToDto(w, f);
}
