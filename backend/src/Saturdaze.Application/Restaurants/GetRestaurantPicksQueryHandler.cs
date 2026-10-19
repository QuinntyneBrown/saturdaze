using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Photos;
using Saturdaze.Application.Travel;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Restaurants;

public sealed class GetRestaurantPicksQueryHandler
    : IRequestHandler<GetRestaurantPicksQuery, IReadOnlyList<RestaurantDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IPlacePhotoReader? _photos;

    public GetRestaurantPicksQueryHandler(
        IAppDbContext db, ICurrentFamilyAccessor current, IPlacePhotoReader? photos = null)
    {
        _db = db;
        _current = current;
        _photos = photos;
    }

    public async Task<IReadOnlyList<RestaurantDto>> Handle(
        GetRestaurantPicksQuery request,
        CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);
        var day = request.Day.DayOfWeek == DayOfWeek.Sunday ? DayOfWeekend.Sunday : DayOfWeekend.Saturday;

        var query = _db.Restaurants.AsNoTracking().Where(r => r.Slot == request.Slot);
        if (request.WifeApprovedOnly) query = query.Where(r => r.WifeApproved);
        if (request.PatioOnly) query = query.Where(r => r.HasPatio);

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

        var activity = request.NearActivityId is { } id
            ? await _db.Activities.AsNoTracking().SingleOrDefaultAsync(a => a.Id == id, cancellationToken)
            : null;

        // Near an activity (L2-019 AC3): by straight-line distance from it when both
        // places are mapped; otherwise by how close the drive times from home are.
        IEnumerable<Domain.Entities.Restaurant> ordered = activity is null
            ? restaurants.OrderBy(r => r.DriveMinutes).ThenBy(r => r.Name)
            : restaurants
                .OrderBy(r => r.Geo is null || activity.Geo is null ? 1 : 0)
                .ThenBy(r => r.Geo is { } geo && activity.Geo is { } at
                    ? TravelEstimator.DistanceKm(at, geo)
                    : Math.Abs(r.DriveMinutes - activity.DriveMinutes))
                .ThenBy(r => r.Name);

        var page = ordered.Take(request.Take).ToList();
        var photos = _photos is null
            ? new Dictionary<Guid, PlacePhotoDto>()
            : await _photos.PrimaryPhotosAsync(
                PlaceKind.Restaurant, page.Select(r => (r.Id, r.Name)).ToList(), cancellationToken);

        return page
            .Select(r => RestaurantProjection.ToDto(
                r,
                votes
                    .Where(v => v.RestaurantId == r.Id)
                    .OrderBy(v => v.VoterName)
                    .Select(v => new RestaurantVoteDto(v.VoterName, v.Vote))
                    .ToList(),
                lockedIds.Contains(r.Id),
                photos.GetValueOrDefault(r.Id)))
            .ToList();
    }
}
