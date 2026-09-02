using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Planning;

/// <summary>
/// Everything the planner needs for one family + weekend, loaded once.
/// Generate, regenerate (whole weekend or one day) and swap all consume the
/// same context so the catalogue, forecast and history are identical across
/// those paths.
/// </summary>
public sealed record PlannerContext(
    Family Family,
    DateOnly WeekendOf,
    IReadOnlyList<Activity> Activities,
    IReadOnlyList<Restaurant> Restaurants,
    IReadOnlyList<LocalEvent> Events,
    IReadOnlyList<WeatherForecast> Forecast,
    IReadOnlyList<HistoricalActivity> History)
{
    public PlannerInputs ToInputs(
        IReadOnlyList<ItineraryBlock> lockedBlocks,
        ShoppingErrand? errand,
        int seed)
        => new(
            Family.Id,
            WeekendOf,
            Family.Members,
            Family.Commitments,
            Family.Preferences,
            Activities,
            Restaurants,
            Events,
            Forecast,
            History,
            errand,
            lockedBlocks,
            TryNew: Family.TryNewEnabled,
            Seed: seed);

    public WeatherForecast ForecastFor(DayOfWeekend day)
    {
        var date = day == DayOfWeekend.Saturday ? WeekendOf : WeekendOf.AddDays(1);
        return Forecast.FirstOrDefault(f => f.Date == date)
            ?? new WeatherForecast(date, Array.Empty<string>(), null, null, null, Unavailable: true);
    }
}

public sealed class PlannerInputLoader
{
    private readonly IAppDbContext _db;
    private readonly WeekendForecastService _forecast;

    public PlannerInputLoader(IAppDbContext db, WeekendForecastService forecast)
    {
        _db = db;
        _forecast = forecast;
    }

    public async Task<PlannerContext> LoadAsync(Guid familyId, DateOnly weekendOf, CancellationToken ct)
    {
        var family = await _db.Families
            .AsNoTracking()
            .Include(f => f.Members)
            .Include(f => f.Commitments)
            .Include(f => f.Preferences)
            .SingleOrDefaultAsync(f => f.Id == familyId, ct)
            ?? throw new NotFoundException(nameof(Family), familyId);

        var weekendEnd = weekendOf.AddDays(1);

        var activities = await _db.Activities.AsNoTracking().ToListAsync(ct);
        var restaurants = await _db.Restaurants.AsNoTracking().Where(r => r.WifeApproved).ToListAsync(ct);
        var events = await _db.LocalEvents.AsNoTracking()
            .Where(e => e.StartsOn <= weekendEnd && e.EndsOn >= weekendOf)
            .ToListAsync(ct);

        var forecast = await _forecast.GetAsync(weekendOf, ct);

        var history = await _db.ItineraryBlocks.AsNoTracking()
            .Where(b => b.RefId != null && b.Kind == BlockKind.Activity)
            .Join(_db.Weekends, b => b.WeekendId, w => w.Id,
                (b, w) => new { w.WeekendOf, ActivityId = b.RefId!.Value, w.FamilyId })
            .Where(x => x.FamilyId == familyId && x.WeekendOf < weekendOf)
            .Select(x => new HistoricalActivity(x.WeekendOf, x.ActivityId))
            .ToListAsync(ct);

        return new PlannerContext(family, weekendOf, activities, restaurants, events, forecast, history);
    }
}
