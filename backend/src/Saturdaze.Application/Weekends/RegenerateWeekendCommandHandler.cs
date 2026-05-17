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

public sealed class RegenerateWeekendCommandHandler : IRequestHandler<RegenerateWeekendCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly IWeekendPlanner _planner;
    private readonly IWeatherClient _weather;
    private readonly IOptions<HomeLocationOptions> _home;

    public RegenerateWeekendCommandHandler(
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

    public async Task<WeekendDto> Handle(RegenerateWeekendCommand request, CancellationToken cancellationToken)
    {
        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(w => w.Id == request.WeekendId, cancellationToken)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);

        var lockedBlocks = weekend.Blocks
            .Where(b => b.IsLocked && b.Kind != BlockKind.Commitment)
            .ToList();

        var family = await _db.Families
            .Include(f => f.Members).Include(f => f.Commitments).Include(f => f.Preferences)
            .SingleAsync(f => f.Id == weekend.FamilyId, cancellationToken);

        var activities = await _db.Activities.AsNoTracking().ToListAsync(cancellationToken);
        var restaurants = await _db.Restaurants.AsNoTracking().Where(r => r.WifeApproved).ToListAsync(cancellationToken);

        var weekendOf = weekend.WeekendOf;
        var weekendEnd = weekendOf.AddDays(1);
        var events = await _db.LocalEvents.AsNoTracking()
            .Where(e => e.StartsOn <= weekendEnd && e.EndsOn >= weekendOf)
            .ToListAsync(cancellationToken);

        var forecast = await _weather.GetForecastAsync(
            _home.Value.Latitude, _home.Value.Longitude, weekendOf, weekendEnd, cancellationToken);

        var history = await _db.ItineraryBlocks.AsNoTracking()
            .Where(b => b.RefId != null && b.Kind == BlockKind.Activity)
            .Join(_db.Weekends, b => b.WeekendId, w => w.Id,
                (b, w) => new { w.WeekendOf, ActivityId = b.RefId!.Value, w.FamilyId })
            .Where(x => x.FamilyId == weekend.FamilyId && x.WeekendOf < weekendOf)
            .Select(x => new HistoricalActivity(x.WeekendOf, x.ActivityId))
            .ToListAsync(cancellationToken);

        weekend.RegenerateCount++;
        var seed = weekendOf.DayNumber + weekend.RegenerateCount * 31;

        var pendingErrand = weekend.Errands.FirstOrDefault(e => !e.Done);
        var inputs = new PlannerInputs(
            weekend.FamilyId, weekendOf, family.Members, family.Commitments, family.Preferences,
            activities, restaurants, events, forecast, history,
            Errand: pendingErrand, LockedBlocks: lockedBlocks, TryNew: false, Seed: seed);

        var planned = _planner.Plan(inputs);

        // Remove all non-locked blocks; keep locked.
        var lockedIds = lockedBlocks.Select(b => b.Id).ToHashSet();
        foreach (var b in weekend.Blocks.Where(b => !lockedIds.Contains(b.Id)).ToList())
        {
            weekend.Blocks.Remove(b);
            _db.ItineraryBlocks.Remove(b);
        }

        // Planner output includes locked blocks (added by BuildFixedBlocks). Skip those when adding.
        foreach (var b in planned.Where(p => !lockedIds.Contains(p.Id)))
        {
            var entity = new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                WeekendId = weekend.Id,
                Day = b.Day,
                StartTime = b.StartTime,
                EndTime = b.EndTime,
                Kind = b.Kind,
                Title = b.Title,
                RefId = b.RefId,
                IsLocked = false,
                Reason = b.Reason,
                SortOrder = b.SortOrder
            };
            _db.ItineraryBlocks.Add(entity);
        }

        await _db.SaveChangesAsync(cancellationToken);

        return WeekendMapper.ToDto(weekend, forecast);
    }
}
