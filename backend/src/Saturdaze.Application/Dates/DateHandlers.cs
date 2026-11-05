using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Dates;

public sealed class PlanDateCommandHandler : IRequestHandler<PlanDateCommand, CoupleDateDto>
{
    private readonly IAppDbContext _db;
    private readonly DateWorkflow _flow;
    private readonly IDateTimeProvider _clock;

    public PlanDateCommandHandler(IAppDbContext db, DateWorkflow flow, IDateTimeProvider clock)
    {
        _db = db;
        _flow = flow;
        _clock = clock;
    }

    public async Task<CoupleDateDto> Handle(PlanDateCommand request, CancellationToken ct)
    {
        var familyId = await _flow.FamilyIdAsync(ct);
        var weekend = await _flow.WeekendAsync(familyId, request.WeekendId, ct);
        var day = request.Day!.Value;
        var meal = request.Meal!.Value;

        // Idempotent (L2-219 AC2, ADR-003): the meal and day's date, as it is.
        var existing = await _db.CoupleDates
            .SingleOrDefaultAsync(d => d.WeekendId == weekend.Id && d.Day == day && d.Meal == meal, ct);
        if (existing is not null) return await _flow.ToDtoAsync(existing, ct);

        var members = await _flow.MembersAsync(familyId, ct);
        var attendees = DateAttendees.Resolve(members, request.AttendeeMemberIds);
        DateWindow.Check(weekend, _clock.Today);

        var date = new CoupleDate
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            WeekendId = weekend.Id,
            Day = day,
            Meal = meal,
            AttendeeMemberIds = attendees.Select(a => a.Id).ToList(),
            CreatedUtc = _clock.UtcNow,
        };
        _db.CoupleDates.Add(date);
        await _flow.PlanAsync(weekend, date, attendees, null, new[] { day }, ct);
        return await _flow.ToDtoAsync(date, ct);
    }
}

public sealed class GetDatesQueryHandler : IRequestHandler<GetDatesQuery, CoupleDatesDto>
{
    private readonly IAppDbContext _db;
    private readonly DateWorkflow _flow;

    public GetDatesQueryHandler(IAppDbContext db, DateWorkflow flow)
    {
        _db = db;
        _flow = flow;
    }

    public async Task<CoupleDatesDto> Handle(GetDatesQuery request, CancellationToken ct)
    {
        var familyId = await _flow.FamilyIdAsync(ct);
        var weekend = await _db.Weekends.AsNoTracking()
            .SingleOrDefaultAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, ct)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);
        var dates = await _db.CoupleDates.AsNoTracking().Where(d => d.WeekendId == weekend.Id).ToListAsync(ct);
        var adults = DateAttendees.Adults(await _flow.MembersAsync(familyId, ct));
        var canPlan = adults.Count >= 2;
        return new CoupleDatesDto(
            await _flow.ToDtosAsync(dates, ct),
            adults.Select(a => new DateAdultDto(a.Id, a.Name, a.Age)).ToList(),
            canPlan,
            canPlan ? null : DateAttendees.NeedsTwoAdults);
    }
}

public sealed class ChangeDateCommandHandler : IRequestHandler<ChangeDateCommand, CoupleDateDto>
{
    private readonly IAppDbContext _db;
    private readonly DateWorkflow _flow;

    public ChangeDateCommandHandler(IAppDbContext db, DateWorkflow flow)
    {
        _db = db;
        _flow = flow;
    }

    public async Task<CoupleDateDto> Handle(ChangeDateCommand request, CancellationToken ct)
    {
        var familyId = await _flow.FamilyIdAsync(ct);
        var weekend = await _flow.WeekendAsync(familyId, request.WeekendId, ct);
        var date = await _flow.DateAsync(familyId, weekend.Id, request.DateId, ct);
        var members = await _flow.MembersAsync(familyId, ct);
        var attendees = members.Where(m => date.AttendeeMemberIds.Contains(m.Id)).ToList();
        var days = new List<DayOfWeekend> { date.Day };
        Guid? avoid = null;

        switch (request.Change)
        {
            case DateChange.Move:
                var day = request.Day!.Value;
                var meal = request.Meal!.Value;
                if ((day, meal) != (date.Day, date.Meal)
                    && await _db.CoupleDates.AnyAsync(d => d.WeekendId == weekend.Id && d.Day == day && d.Meal == meal, ct))
                    throw new ConflictException("date_slot_taken", $"There is already a {meal.ToString().ToLowerInvariant()} date on {day}.");
                date.Day = day;
                date.Meal = meal;
                date.RejectedRestaurantIds.Clear();
                days.Add(day);
                break;
            case DateChange.Regenerate:
                date.RegenerateCount++;
                avoid = date.RestaurantId;
                break;
            case DateChange.SwapRestaurant:
                date.RejectedRestaurantIds = date.RejectedRestaurantIds.Append(date.RestaurantId).Distinct().ToList();
                break;
            case DateChange.SwapActivity:
                var previous = date.ActivityId;
                if (previous is { } current)
                    date.RejectedActivityIds = date.RejectedActivityIds.Append(current).Distinct().ToList();
                date.ActivityDropped = false;
                await _flow.PlanAsync(weekend, date, attendees, null, days, ct, plan =>
                {
                    if (plan.Activity is null || plan.Activity.Id == previous)
                        throw new ConflictException("no_activity_fits", "No other activity near the restaurant fits the date.");
                });
                return await _flow.ToDtoAsync(date, ct);
            case DateChange.DropActivity:
                date.ActivityDropped = true;
                break;
        }

        // A change that cannot be planned throws before anything is saved, so the date stays as it was (L2-223 AC5).
        await _flow.PlanAsync(weekend, date, attendees, avoid, days, ct);
        return await _flow.ToDtoAsync(date, ct);
    }
}

public sealed class CancelDateCommandHandler : IRequestHandler<CancelDateCommand>
{
    private readonly IAppDbContext _db;
    private readonly DateWorkflow _flow;

    public CancelDateCommandHandler(IAppDbContext db, DateWorkflow flow)
    {
        _db = db;
        _flow = flow;
    }

    public async Task Handle(CancelDateCommand request, CancellationToken ct)
    {
        var familyId = await _flow.FamilyIdAsync(ct);
        var weekend = await _flow.WeekendAsync(familyId, request.WeekendId, ct);
        var date = await _flow.DateAsync(familyId, weekend.Id, request.DateId, ct);
        _db.CoupleDates.Remove(date);
        await _flow.RemoveFromWeekendAsync(weekend, date, ct);
    }
}
