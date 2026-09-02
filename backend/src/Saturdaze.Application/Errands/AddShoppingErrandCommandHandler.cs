using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
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
    private readonly ICurrentFamilyAccessor _current;
    private readonly IWeekendPlanner _planner;
    private readonly WeekendForecastService _forecast;

    public AddShoppingErrandCommandHandler(
        IAppDbContext db,
        ICurrentFamilyAccessor current,
        IWeekendPlanner planner,
        WeekendForecastService forecast)
    {
        _db = db;
        _current = current;
        _planner = planner;
        _forecast = forecast;
    }

    public async Task<WeekendDto> Handle(AddShoppingErrandCommand request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, cancellationToken)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);

        var errand = new ShoppingErrand
        {
            Id = Guid.NewGuid(),
            WeekendId = weekend.Id,
            Description = request.Description,
            EstimatedMinutes = request.EstimatedMinutes,
            Done = false
        };
        _db.ShoppingErrands.Add(errand);

        // L1-008: propose the best slot now, not on the next regenerate.
        var order = request.PreferredDay == DayOfWeekend.Sunday
            ? new[] { DayOfWeekend.Sunday, DayOfWeekend.Saturday }
            : new[] { DayOfWeekend.Saturday, DayOfWeekend.Sunday };

        foreach (var day in order)
        {
            if (TryPlace(weekend, errand, day)) break;
        }

        await _db.SaveChangesAsync(cancellationToken);

        var forecast = await _forecast.GetAsync(weekend.WeekendOf, cancellationToken);
        return WeekendMapper.ToDto(weekend, forecast);
    }

    private bool TryPlace(Weekend weekend, ShoppingErrand errand, DayOfWeekend day)
    {
        var dayBlocks = weekend.Blocks.Where(b => b.Day == day).ToList();
        var placed = _planner.PlaceErrand(errand, dayBlocks, day);
        if (placed is null) return false;

        // The errand takes over whatever downtime it overlaps; the rest of the
        // day's free time is re-derived afterwards. New blocks go through the
        // DbSet so EF tracks them as Added (they already carry a Guid key).
        foreach (var downtime in dayBlocks
                     .Where(b => b.Kind == BlockKind.Downtime && Overlaps(b, placed))
                     .ToList())
        {
            dayBlocks.Remove(downtime);
            weekend.Blocks.Remove(downtime);
            _db.ItineraryBlocks.Remove(downtime);
        }

        placed.WeekendId = weekend.Id;
        dayBlocks.Add(placed);
        _db.ItineraryBlocks.Add(placed);

        foreach (var gap in _planner.FillDowntime(day, dayBlocks))
        {
            gap.WeekendId = weekend.Id;
            dayBlocks.Add(gap);
            _db.ItineraryBlocks.Add(gap);
        }

        var order = 0;
        foreach (var block in dayBlocks.OrderBy(b => b.StartTime))
            block.SortOrder = order++;

        return true;
    }

    private static bool Overlaps(ItineraryBlock a, ItineraryBlock b)
        => a.StartTime < b.EndTime && b.StartTime < a.EndTime;
}
