using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Planning;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Weekends;

public sealed class RegenerateWeekendDayCommandHandler
    : IRequestHandler<RegenerateWeekendDayCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly IWeekendPlanner _planner;
    private readonly IWeatherClient _weather;
    private readonly IOptions<HomeLocationOptions> _home;

    public RegenerateWeekendDayCommandHandler(
        IAppDbContext db,
        IWeekendPlanner planner,
        IWeatherClient weather,
        IOptions<HomeLocationOptions> home)
    {
        _db = db;
        _planner = planner;
        _weather = weather;
        _home = home;
    }

    public async Task<WeekendDto> Handle(RegenerateWeekendDayCommand request, CancellationToken cancellationToken)
    {
        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(w => w.Id == request.WeekendId, cancellationToken)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);

        var fixedBlocks = weekend.Blocks
            .Where(b => (b.Day != request.Day || b.IsLocked) && b.Kind != BlockKind.Commitment)
            .ToList();

        var family = await _db.Families
            .Include(f => f.Members)
            .Include(f => f.Commitments)
            .Include(f => f.Preferences)
            .SingleAsync(f => f.Id == weekend.FamilyId, cancellationToken);

        var activities = await _db.Activities.AsNoTracking().ToListAsync(cancellationToken);
        var restaurants = await _db.Restaurants.AsNoTracking().Where(r => r.WifeApproved).ToListAsync(cancellationToken);
        var weekendEnd = weekend.WeekendOf.AddDays(1);
        var events = await _db.LocalEvents.AsNoTracking()
            .Where(e => e.StartsOn <= weekendEnd && e.EndsOn >= weekend.WeekendOf)
            .ToListAsync(cancellationToken);
        var forecast = await _weather.GetForecastAsync(
            _home.Value.Latitude,
            _home.Value.Longitude,
            weekend.WeekendOf,
            weekendEnd,
            cancellationToken);
        var history = await _db.ItineraryBlocks.AsNoTracking()
            .Where(b => b.RefId != null && b.Kind == BlockKind.Activity)
            .Join(_db.Weekends, b => b.WeekendId, w => w.Id,
                (b, w) => new { w.WeekendOf, ActivityId = b.RefId!.Value, w.FamilyId })
            .Where(x => x.FamilyId == weekend.FamilyId && x.WeekendOf < weekend.WeekendOf)
            .Select(x => new HistoricalActivity(x.WeekendOf, x.ActivityId))
            .ToListAsync(cancellationToken);

        weekend.RegenerateCount++;
        var inputs = new PlannerInputs(
            weekend.FamilyId,
            weekend.WeekendOf,
            family.Members,
            family.Commitments,
            family.Preferences,
            activities,
            restaurants,
            events,
            forecast,
            history,
            Errand: weekend.Errands.FirstOrDefault(e => !e.Done),
            LockedBlocks: fixedBlocks,
            TryNew: false,
            Seed: weekend.WeekendOf.DayNumber + weekend.RegenerateCount * 47 + (int)request.Day);

        var planned = _planner.Plan(inputs);
        var fixedIds = fixedBlocks.Select(b => b.Id).ToHashSet();

        foreach (var block in weekend.Blocks
                     .Where(b => b.Day == request.Day && !fixedIds.Contains(b.Id))
                     .ToList())
        {
            weekend.Blocks.Remove(block);
            _db.ItineraryBlocks.Remove(block);
        }

        foreach (var block in planned.Where(b => b.Day == request.Day && !fixedIds.Contains(b.Id)))
        {
            var entity = new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                WeekendId = weekend.Id,
                Day = block.Day,
                StartTime = block.StartTime,
                EndTime = block.EndTime,
                Kind = block.Kind,
                Title = block.Title,
                RefId = block.RefId,
                IsLocked = false,
                Reason = block.Reason,
                SortOrder = block.SortOrder
            };
            _db.ItineraryBlocks.Add(entity);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return WeekendMapper.ToDto(weekend, forecast);
    }
}
