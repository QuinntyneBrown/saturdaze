using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Planning;
using Saturdaze.Application.Weather;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Errands;

public sealed class AddShoppingErrandCommandHandler : IRequestHandler<AddShoppingErrandCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly IWeekendPlanner _planner;
    private readonly IWeatherClient _weather;
    private readonly IOptions<HomeLocationOptions> _home;

    public AddShoppingErrandCommandHandler(
        IAppDbContext db, IWeekendPlanner planner, IWeatherClient weather, IOptions<HomeLocationOptions> home)
    {
        _db = db;
        _planner = planner;
        _weather = weather;
        _home = home;
    }

    public async Task<WeekendDto> Handle(AddShoppingErrandCommand request, CancellationToken cancellationToken)
    {
        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(w => w.Id == request.WeekendId, cancellationToken)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);

        var errand = new ShoppingErrand
        {
            Id = Guid.NewGuid(),
            WeekendId = weekend.Id,
            Description = request.Description,
            EstimatedMinutes = request.EstimatedMinutes,
            Done = false
        };
        weekend.Errands.Add(errand);
        _db.ShoppingErrands.Add(errand);

        await _db.SaveChangesAsync(cancellationToken);

        var forecast = await _weather.GetForecastAsync(
            _home.Value.Latitude, _home.Value.Longitude,
            weekend.WeekendOf, weekend.WeekendOf.AddDays(1), cancellationToken);
        return WeekendMapper.ToDto(weekend, forecast);
    }
}
