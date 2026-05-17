using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Planning;
using Saturdaze.Application.Weather;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Restaurants;

public sealed class LockRestaurantCommandHandler : IRequestHandler<LockRestaurantCommand, RestaurantDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IDateTimeProvider _clock;
    private readonly IWeatherClient _weather;
    private readonly IOptions<HomeLocationOptions> _home;

    public LockRestaurantCommandHandler(
        IAppDbContext db,
        ICurrentFamilyAccessor current,
        IDateTimeProvider clock,
        IWeatherClient weather,
        IOptions<HomeLocationOptions> home)
    {
        _db = db;
        _current = current;
        _clock = clock;
        _weather = weather;
        _home = home;
    }

    public async Task<RestaurantDto> Handle(LockRestaurantCommand request, CancellationToken cancellationToken)
    {
        var restaurant = await _db.Restaurants
            .SingleOrDefaultAsync(r => r.Id == request.RestaurantId, cancellationToken)
            ?? throw new NotFoundException(nameof(Restaurant), request.RestaurantId);

        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);
        var existingLocks = await _db.RestaurantLocks
            .Where(l => l.FamilyId == familyId && l.Day == request.Day && l.Slot == request.Slot)
            .ToListAsync(cancellationToken);
        foreach (var existing in existingLocks)
            _db.RestaurantLocks.Remove(existing);

        _db.RestaurantLocks.Add(new RestaurantLock
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            RestaurantId = restaurant.Id,
            Day = request.Day,
            Slot = request.Slot,
            CreatedAtUtc = _clock.UtcNow
        });

        await ApplyToCurrentWeekend(familyId, restaurant, request.Day, request.Slot, cancellationToken);
        await _db.SaveChangesAsync(cancellationToken);

        var votes = await _db.RestaurantVotes.AsNoTracking()
            .Where(v => v.FamilyId == familyId && v.RestaurantId == restaurant.Id)
            .OrderBy(v => v.VoterName)
            .Select(v => new RestaurantVoteDto(v.VoterName, v.Vote))
            .ToListAsync(cancellationToken);

        return RestaurantProjection.ToDto(restaurant, votes, locked: true);
    }

    private async Task ApplyToCurrentWeekend(
        Guid familyId,
        Restaurant restaurant,
        DayOfWeekend day,
        MealSlot slot,
        CancellationToken cancellationToken)
    {
        var weekendOf = GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday(_clock.Today);
        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .FirstOrDefaultAsync(w => w.FamilyId == familyId && w.WeekendOf == weekendOf, cancellationToken);
        if (weekend is null) return;

        var meal = weekend.Blocks.FirstOrDefault(b =>
            b.Day == day &&
            b.Kind == BlockKind.Meal &&
            IsSlot(b.StartTime, slot));

        if (meal is null)
        {
            meal = new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                WeekendId = weekend.Id,
                Day = day,
                StartTime = slot == MealSlot.Lunch ? PlannerTimes.LunchWindowStart : PlannerTimes.DinnerWindowStart,
                EndTime = (slot == MealSlot.Lunch ? PlannerTimes.LunchWindowStart : PlannerTimes.DinnerWindowStart)
                    .AddMinutes(PlannerTimes.MealMinutes),
                Kind = BlockKind.Meal,
                SortOrder = (weekend.Blocks.Where(b => b.Day == day).Max(b => (int?)b.SortOrder) ?? 0) + 1
            };
            _db.ItineraryBlocks.Add(meal);
        }

        meal.Title = $"{slot}: {restaurant.Name}";
        meal.RefId = restaurant.Id;
        meal.IsLocked = true;
        meal.Reason = "restaurant locked by family vote";
    }

    private static bool IsSlot(TimeOnly startTime, MealSlot slot)
        => slot == MealSlot.Lunch
            ? startTime < new TimeOnly(15, 0)
            : startTime >= new TimeOnly(15, 0);
}
