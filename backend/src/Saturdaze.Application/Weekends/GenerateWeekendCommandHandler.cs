using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Planning;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Weekends;

public sealed class GenerateWeekendCommandHandler : IRequestHandler<GenerateWeekendCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IWeekendPlanner _planner;
    private readonly IWeatherClient _weather;
    private readonly Microsoft.Extensions.Options.IOptions<HomeLocationOptions> _home;

    public GenerateWeekendCommandHandler(
        IAppDbContext db,
        ICurrentFamilyAccessor current,
        IWeekendPlanner planner,
        IWeatherClient weather,
        Microsoft.Extensions.Options.IOptions<HomeLocationOptions> home)
    {
        _db = db;
        _current = current;
        _planner = planner;
        _weather = weather;
        _home = home;
    }

    public async Task<WeekendDto> Handle(GenerateWeekendCommand request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        // Idempotent: if a weekend already exists for this family + date, return it.
        var existing = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .FirstOrDefaultAsync(w => w.FamilyId == familyId && w.WeekendOf == request.WeekendOf, cancellationToken);
        if (existing is not null)
        {
            var existingForecast = await _weather.GetForecastAsync(
                _home.Value.Latitude, _home.Value.Longitude,
                existing.WeekendOf, existing.WeekendOf.AddDays(1), cancellationToken);
            return WeekendMapper.ToDto(existing, existingForecast);
        }

        var family = await _db.Families
            .Include(f => f.Members)
            .Include(f => f.Commitments)
            .Include(f => f.Preferences)
            .SingleAsync(f => f.Id == familyId, cancellationToken);

        var activities = await _db.Activities.AsNoTracking().ToListAsync(cancellationToken);
        var restaurants = await _db.Restaurants.AsNoTracking().Where(r => r.WifeApproved).ToListAsync(cancellationToken);

        var weekendOf = request.WeekendOf;
        var weekendEnd = weekendOf.AddDays(1);
        var events = await _db.LocalEvents.AsNoTracking()
            .Where(e => e.StartsOn <= weekendEnd && e.EndsOn >= weekendOf)
            .ToListAsync(cancellationToken);

        var forecast = await _weather.GetForecastAsync(
            _home.Value.Latitude, _home.Value.Longitude,
            weekendOf, weekendEnd, cancellationToken);

        var history = await _db.ItineraryBlocks
            .AsNoTracking()
            .Where(b => b.RefId != null && b.Kind == BlockKind.Activity)
            .Join(_db.Weekends, b => b.WeekendId, w => w.Id, (b, w) => new { w.WeekendOf, ActivityId = b.RefId!.Value, w.FamilyId })
            .Where(x => x.FamilyId == familyId && x.WeekendOf < weekendOf)
            .Select(x => new HistoricalActivity(x.WeekendOf, x.ActivityId))
            .ToListAsync(cancellationToken);

        var inputs = new PlannerInputs(
            FamilyId: familyId,
            WeekendOf: weekendOf,
            Members: family.Members,
            Commitments: family.Commitments,
            Preferences: family.Preferences,
            Activities: activities,
            Restaurants: restaurants,
            Events: events,
            Forecast: forecast,
            History: history,
            Errand: null,
            LockedBlocks: Array.Empty<ItineraryBlock>(),
            TryNew: false,
            Seed: weekendOf.DayNumber);

        var blocks = _planner.Plan(inputs);

        var weekend = new Weekend
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            WeekendOf = weekendOf,
            RegenerateCount = 0,
            Blocks = blocks.Select(b => new ItineraryBlock
            {
                Id = b.Id == Guid.Empty ? Guid.NewGuid() : b.Id,
                Day = b.Day,
                StartTime = b.StartTime,
                EndTime = b.EndTime,
                Kind = b.Kind,
                Title = b.Title,
                RefId = b.RefId,
                IsLocked = b.IsLocked,
                Reason = b.Reason,
                SortOrder = b.SortOrder
            }).ToList()
        };
        _db.Weekends.Add(weekend);
        await _db.SaveChangesAsync(cancellationToken);

        return WeekendMapper.ToDto(weekend, forecast);
    }
}
