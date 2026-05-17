using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Weekends;

public sealed class LockWeekendDayCommandHandler : IRequestHandler<LockWeekendDayCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly IWeatherClient _weather;
    private readonly IOptions<HomeLocationOptions> _home;

    public LockWeekendDayCommandHandler(
        IAppDbContext db,
        IWeatherClient weather,
        IOptions<HomeLocationOptions> home)
    {
        _db = db;
        _weather = weather;
        _home = home;
    }

    public async Task<WeekendDto> Handle(LockWeekendDayCommand request, CancellationToken cancellationToken)
    {
        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(w => w.Id == request.WeekendId, cancellationToken)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);

        foreach (var block in weekend.Blocks.Where(b => b.Day == request.Day))
            block.IsLocked = request.Locked;

        await _db.SaveChangesAsync(cancellationToken);

        var forecast = await _weather.GetForecastAsync(
            _home.Value.Latitude,
            _home.Value.Longitude,
            weekend.WeekendOf,
            weekend.WeekendOf.AddDays(1),
            cancellationToken);
        return WeekendMapper.ToDto(weekend, forecast);
    }
}
