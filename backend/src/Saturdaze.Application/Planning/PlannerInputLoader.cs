using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Calendar;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Travel;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Domain.ValueObjects;

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
    IReadOnlyList<HistoricalActivity> History,
    GeoLocation Home,
    IReadOnlyList<CalendarCommitment>? CalendarCommitments = null,
    PlannerProfile? Profile = null,
    IReadOnlyDictionary<DayOfWeekend, TimeOnly>? Sunsets = null)
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
            Seed: seed,
            CalendarCommitments: CalendarCommitments,
            Profile: Profile,
            Home: Home,
            Sunsets: Sunsets);

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
    private readonly HomeLocationOptions _home;
    private readonly ICalendarCommitmentSource _calendar;
    private readonly CalendarOptions _zone;

    public PlannerInputLoader(
        IAppDbContext db,
        WeekendForecastService forecast,
        IOptions<HomeLocationOptions> home,
        ICalendarCommitmentSource calendar,
        IOptions<CalendarOptions> zone)
    {
        _db = db;
        _forecast = forecast;
        _home = home.Value;
        _calendar = calendar;
        _zone = zone.Value;
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


        var history = await _db.ItineraryBlocks.AsNoTracking()
            .Where(b => b.RefId != null && b.Kind == BlockKind.Activity)
            .Join(_db.Weekends, b => b.WeekendId, w => w.Id,
                (b, w) => new { w.WeekendOf, ActivityId = b.RefId!.Value, w.FamilyId, w.Rating })
            .Where(x => x.FamilyId == familyId && x.WeekendOf < weekendOf)
            .Select(x => new HistoricalActivity(x.WeekendOf, x.ActivityId, x.Rating))
            .ToListAsync(ct);

        var home = family.HomeCoordinates?.Copy() ?? new GeoLocation
        {
            Latitude = (decimal)_home.Latitude,
            Longitude = (decimal)_home.Longitude,
            Address = _home.Name,
        };

        // Drives start from this family's own home (L2-190). The rows are untracked copies.
        if (family.HomeCoordinates is { } own)
        {
            foreach (var a in activities) a.DriveMinutes = FamilyDriveTime.Minutes(own, a.Geo, a.DriveMinutes);
            foreach (var r in restaurants) r.DriveMinutes = FamilyDriveTime.Minutes(own, r.Geo, r.DriveMinutes);
            foreach (var e in events) e.DriveMinutes = FamilyDriveTime.Minutes(own, e.Geo, e.DriveMinutes);
        }

        var forecast = await _forecast.GetAsync(weekendOf, family.HomeCoordinates, ct);
        var profile = new PlannerProfile(
            family.DayStart,
            family.YoungestBedtime,
            family.OutingsPerDay,
            family.QuietSunday,
            family.SundayDinnerAtHome,
            family.Leaning,
            family.MaxDriveMinutes,
            family.ExcludedThemes.ToHashSet(StringComparer.OrdinalIgnoreCase));

        // Weekend events from the family's connected calendars join the fixed blocks (L2-177).
        var calendar = await _calendar.GetAsync(familyId, weekendOf, ct);

        // Sunset at home each day, for "back before sunset" (L2-200).
        var zone = TimeZoneInfo.FindSystemTimeZoneById(_zone.TimeZone);
        var sunsets = new Dictionary<DayOfWeekend, TimeOnly>
        {
            [DayOfWeekend.Saturday] = SunCalculator.Sunset((double)home.Latitude, (double)home.Longitude, weekendOf, zone),
            [DayOfWeekend.Sunday] = SunCalculator.Sunset((double)home.Latitude, (double)home.Longitude, weekendEnd, zone),
        };

        return new PlannerContext(family, weekendOf, activities, restaurants, events, forecast, history, home, calendar, profile, sunsets);
    }
}
