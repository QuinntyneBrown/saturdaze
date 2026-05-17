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

namespace Saturdaze.Application.Blocks;

public sealed class SwapBlockCommandHandler : IRequestHandler<SwapBlockCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly IWeekendPlanner _planner;
    private readonly IWeatherClient _weather;
    private readonly IOptions<HomeLocationOptions> _home;

    public SwapBlockCommandHandler(
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

    public async Task<WeekendDto> Handle(SwapBlockCommand request, CancellationToken cancellationToken)
    {
        var target = await _db.ItineraryBlocks
            .SingleOrDefaultAsync(b => b.Id == request.BlockId, cancellationToken)
            ?? throw new NotFoundException(nameof(ItineraryBlock), request.BlockId);

        if (target.Kind != BlockKind.Activity)
            throw new ConflictException("Only activity blocks can be swapped.");
        if (target.IsLocked)
            throw new ConflictException("Locked blocks cannot be swapped. Unlock first.");

        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .SingleAsync(w => w.Id == target.WeekendId, cancellationToken);

        var dayBlocks = weekend.Blocks.Where(b => b.Day == target.Day).OrderBy(b => b.StartTime).ToList();
        var adjacentDrives = dayBlocks
            .Where(b => b.Kind == BlockKind.Drive && (b.EndTime == target.StartTime || b.StartTime == target.EndTime))
            .ToList();
        var window = (start: adjacentDrives.Concat(new[] { target }).Min(b => b.StartTime),
                      end:   adjacentDrives.Concat(new[] { target }).Max(b => b.EndTime));

        var family = await _db.Families
            .Include(f => f.Members).Include(f => f.Commitments).Include(f => f.Preferences)
            .SingleAsync(f => f.Id == weekend.FamilyId, cancellationToken);

        var activities = await _db.Activities.AsNoTracking().ToListAsync(cancellationToken);
        var restaurants = await _db.Restaurants.AsNoTracking().Where(r => r.WifeApproved).ToListAsync(cancellationToken);

        var weekendOf = weekend.WeekendOf;
        var forecastAll = await _weather.GetForecastAsync(
            _home.Value.Latitude, _home.Value.Longitude,
            weekendOf, weekendOf.AddDays(1), cancellationToken);
        var dayDate = target.Day == DayOfWeekend.Saturday ? weekendOf : weekendOf.AddDays(1);
        var dayForecast = forecastAll.SingleOrDefault(f => f.Date == dayDate)
            ?? new WeatherForecast(dayDate, Array.Empty<string>(), null, null, null, Unavailable: true);

        var rejected = new HashSet<Guid>(request.RejectedActivityIds ?? Array.Empty<Guid>());
        if (target.RefId is Guid currentActivityId) rejected.Add(currentActivityId);

        var inputs = new PlannerInputs(
            weekend.FamilyId, weekendOf, family.Members, family.Commitments, family.Preferences,
            activities, restaurants, Array.Empty<LocalEvent>(),
            forecastAll, Array.Empty<HistoricalActivity>(),
            Errand: null, LockedBlocks: Array.Empty<ItineraryBlock>(),
            TryNew: false,
            Seed: weekendOf.DayNumber + (request.RejectedActivityIds?.Count ?? 0) + 1);

        var pick = _planner.PickActivityForGap(inputs, target.Day, window.start, window.end, rejected);
        if (pick is null)
            throw new NotFoundException("No alternative activity available for this slot.");

        var newBlocks = _planner.BuildActivityBlocks(
            pick, target.Day, window.start, window.end, dayForecast, tryNew: false);

        // Remove the target and the adjacent drive blocks; add new replacements.
        foreach (var old in adjacentDrives)
        {
            weekend.Blocks.Remove(old);
            _db.ItineraryBlocks.Remove(old);
        }
        weekend.Blocks.Remove(target);
        _db.ItineraryBlocks.Remove(target);
        var nextSort = weekend.Blocks.Where(b => b.Day == target.Day).Max(b => (int?)b.SortOrder) ?? 0;
        foreach (var nb in newBlocks)
        {
            var entity = new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                WeekendId = weekend.Id,
                Day = nb.Day,
                StartTime = nb.StartTime,
                EndTime = nb.EndTime,
                Kind = nb.Kind,
                Title = nb.Title,
                RefId = nb.RefId,
                Reason = "swap pick: " + nb.Reason,
                SortOrder = ++nextSort
            };
            _db.ItineraryBlocks.Add(entity);
        }
        await _db.SaveChangesAsync(cancellationToken);

        return InternalWeekendMapper.ToDto(weekend, forecastAll);
    }
}
