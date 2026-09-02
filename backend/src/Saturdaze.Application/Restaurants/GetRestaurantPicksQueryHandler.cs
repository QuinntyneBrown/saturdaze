using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Restaurants;

public sealed class GetRestaurantPicksQueryHandler
    : IRequestHandler<GetRestaurantPicksQuery, IReadOnlyList<RestaurantDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;

    public GetRestaurantPicksQueryHandler(IAppDbContext db, ICurrentFamilyAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<RestaurantDto>> Handle(
        GetRestaurantPicksQuery request,
        CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);
        var day = request.Day.DayOfWeek == DayOfWeek.Sunday ? DayOfWeekend.Sunday : DayOfWeekend.Saturday;

        var query = _db.Restaurants.AsNoTracking().Where(r => r.Slot == request.Slot);
        if (request.WifeApprovedOnly) query = query.Where(r => r.WifeApproved);

        var restaurants = await query.ToListAsync(cancellationToken);
        var restaurantIds = restaurants.Select(r => r.Id).ToArray();
        var votes = await _db.RestaurantVotes.AsNoTracking()
            .Where(v => v.FamilyId == familyId && restaurantIds.Contains(v.RestaurantId))
            .ToListAsync(cancellationToken);

        // A lock is per (day, slot): Saturday lunch does not lock Sunday lunch (L2-019).
        var lockedIds = await _db.RestaurantLocks.AsNoTracking()
            .Where(l => l.FamilyId == familyId && l.Day == day && l.Slot == request.Slot && restaurantIds.Contains(l.RestaurantId))
            .Select(l => l.RestaurantId)
            .ToListAsync(cancellationToken);

        int? activityDrive = null;
        if (request.NearActivityId is { } id)
        {
            activityDrive = await _db.Activities
                .Where(a => a.Id == id)
                .Select(a => (int?)a.DriveMinutes)
                .SingleOrDefaultAsync(cancellationToken);
        }

        IEnumerable<Domain.Entities.Restaurant> ordered = activityDrive is { } drive
            ? restaurants.OrderBy(r => Math.Abs(r.DriveMinutes - drive)).ThenBy(r => r.Name)
            : restaurants.OrderBy(r => r.DriveMinutes).ThenBy(r => r.Name);

        return ordered
            .Take(request.Take)
            .Select(r => RestaurantProjection.ToDto(
                r,
                votes
                    .Where(v => v.RestaurantId == r.Id)
                    .OrderBy(v => v.VoterName)
                    .Select(v => new RestaurantVoteDto(v.VoterName, v.Vote))
                    .ToList(),
                lockedIds.Contains(r.Id)))
            .ToList();
    }
}
