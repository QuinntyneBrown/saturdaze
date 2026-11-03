using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Planning;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Dates;

/// <summary>
/// The steps every date request shares (ADR-025): load the caller's weekend, plan a date with
/// <see cref="DatePlanner"/>, keep the weekend's one locked <see cref="BlockKind.Date"/> block in step and
/// plan the affected days again around it (L2-222), and map the result.
/// </summary>
public sealed class DateWorkflow
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly PlannerInputLoader _loader;
    private readonly WeekendReplanner _replanner;
    private readonly DatePlanner _planner;

    public DateWorkflow(
        IAppDbContext db, ICurrentFamilyAccessor current, PlannerInputLoader loader,
        WeekendReplanner replanner, DatePlanner planner)
    {
        _db = db;
        _current = current;
        _loader = loader;
        _replanner = replanner;
        _planner = planner;
    }

    public Task<Guid> FamilyIdAsync(CancellationToken ct) => _current.GetCurrentFamilyIdAsync(ct);

    /// <summary>The caller's weekend with its blocks, or 404 (ADR-008).</summary>
    public async Task<Weekend> WeekendAsync(Guid familyId, Guid weekendId, CancellationToken ct) =>
        await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(w => w.Id == weekendId && w.FamilyId == familyId, ct)
        ?? throw new NotFoundException(nameof(Weekend), weekendId);

    public async Task<CoupleDate> DateAsync(Guid familyId, Guid weekendId, Guid dateId, CancellationToken ct) =>
        await _db.CoupleDates.SingleOrDefaultAsync(d => d.Id == dateId && d.WeekendId == weekendId && d.FamilyId == familyId, ct)
        ?? throw new NotFoundException(nameof(CoupleDate), dateId);

    public async Task<IReadOnlyList<FamilyMember>> MembersAsync(Guid familyId, CancellationToken ct) =>
        await _db.FamilyMembers.AsNoTracking().Where(m => m.FamilyId == familyId).ToListAsync(ct);

    /// <summary>
    /// Plans <paramref name="date"/> at its day and meal (throws 409 when nothing fits, leaving it unchanged),
    /// lets <paramref name="check"/> refuse the plan, writes the plan onto it, and re-plans the weekend days in <paramref name="days"/> around it. Saves.
    /// </summary>
    public async Task PlanAsync(
        Weekend weekend, CoupleDate date, IReadOnlyList<FamilyMember> attendees, Guid? avoidRestaurantId,
        IReadOnlyCollection<DayOfWeekend> days, CancellationToken ct, Action<DatePlan>? check = null)
    {
        var ctx = await _loader.LoadAsync(weekend.FamilyId, weekend.WeekendOf, ct);
        var restaurantIds = ctx.Restaurants.Select(r => r.Id).ToList();
        var votes = await _db.RestaurantVotes.AsNoTracking()
            .Where(v => v.FamilyId == weekend.FamilyId && restaurantIds.Contains(v.RestaurantId))
            .ToListAsync(ct);
        var locked = await _db.RestaurantLocks.AsNoTracking()
            .Where(l => l.FamilyId == weekend.FamilyId && l.Day == date.Day && l.Slot == date.Meal)
            .Select(l => (Guid?)l.RestaurantId)
            .FirstOrDefaultAsync(ct);

        var plan = _planner.Plan(new DateRequest(
            ctx,
            attendees,
            date.Day,
            date.Meal,
            DateBusyTime.For(ctx, weekend, date.Day, date.AttendeeMemberIds, date.Id),
            votes.GroupBy(v => v.RestaurantId)
                .ToDictionary(g => g.Key, g => g.Count(v => v.Vote == "up") - g.Count(v => v.Vote == "down")),
            locked,
            date.RejectedRestaurantIds.ToHashSet(),
            date.RejectedActivityIds.ToHashSet(),
            WithActivity: !date.ActivityDropped,
            AvoidRestaurantId: avoidRestaurantId));
        check?.Invoke(plan);

        date.RestaurantId = plan.Restaurant.Id;
        date.ActivityId = plan.Activity?.Id;
        date.StartTime = plan.Start;
        date.EndTime = plan.End;
        date.StepsJson = DateSteps.Serialize(plan.Steps);

        var members = ctx.Family.Members;
        RemoveBlock(weekend, date.Id);
        var care = CoupleDateMapper.KidsNeedCare(date, members);
        var reason = CoupleDateMapper.Names(date, members)
                     + (care.Count > 0 ? $"; kids need care {date.StartTime:H\\:mm}–{date.EndTime:H\\:mm}" : string.Empty);
        var block = new ItineraryBlock
        {
            Id = Guid.NewGuid(),
            WeekendId = weekend.Id,
            Day = date.Day,
            StartTime = date.StartTime,
            EndTime = date.EndTime,
            Kind = BlockKind.Date,
            Title = CoupleDateMapper.Title(date, plan.Restaurant.Name),
            RefId = date.Id,
            IsLocked = true,
            Reason = reason,
        };
        // EF's fix-up puts it in the tracked weekend.Blocks (see WeekendReplanner).
        _db.ItineraryBlocks.Add(block);
        await _db.SaveChangesAsync(ct);

        await ReplanAsync(weekend, days, ct);
    }

    /// <summary>Removes the date's block and re-plans its day (L2-223 AC7). Does not remove the date.</summary>
    public async Task RemoveFromWeekendAsync(Weekend weekend, CoupleDate date, CancellationToken ct)
    {
        RemoveBlock(weekend, date.Id);
        await _db.SaveChangesAsync(ct);
        await ReplanAsync(weekend, new[] { date.Day }, ct);
    }

    public async Task<CoupleDateDto> ToDtoAsync(CoupleDate date, CancellationToken ct) =>
        (await ToDtosAsync(new[] { date }, ct)).Single();

    public async Task<IReadOnlyList<CoupleDateDto>> ToDtosAsync(IReadOnlyCollection<CoupleDate> dates, CancellationToken ct)
    {
        if (dates.Count == 0) return Array.Empty<CoupleDateDto>();
        var familyId = dates.First().FamilyId;
        var members = await MembersAsync(familyId, ct);
        var restaurantIds = dates.Select(d => d.RestaurantId).Distinct().ToList();
        var activityIds = dates.Where(d => d.ActivityId is not null).Select(d => d.ActivityId!.Value).Distinct().ToList();
        var restaurants = await _db.Restaurants.AsNoTracking().Where(r => restaurantIds.Contains(r.Id)).ToDictionaryAsync(r => r.Id, ct);
        var activities = await _db.Activities.AsNoTracking().Where(a => activityIds.Contains(a.Id)).ToDictionaryAsync(a => a.Id, ct);
        return dates
            .OrderBy(d => d.Day).ThenBy(d => d.StartTime)
            .Select(d => CoupleDateMapper.ToDto(d, members, restaurants, activities))
            .ToList();
    }

    private void RemoveBlock(Weekend weekend, Guid dateId)
    {
        foreach (var old in weekend.Blocks.Where(b => b.Kind == BlockKind.Date && b.RefId == dateId).ToList())
        {
            weekend.Blocks.Remove(old);
            _db.ItineraryBlocks.Remove(old);
        }
    }

    private async Task ReplanAsync(Weekend weekend, IReadOnlyCollection<DayOfWeekend> days, CancellationToken ct)
    {
        foreach (var day in days.Distinct().OrderBy(d => d))
        {
            var seed = weekend.WeekendOf.DayNumber + weekend.RegenerateCount * 47 + (int)day;
            await _replanner.ReplanDayAsync(weekend, weekend.FamilyId, day, seed, ct);
        }
    }
}
