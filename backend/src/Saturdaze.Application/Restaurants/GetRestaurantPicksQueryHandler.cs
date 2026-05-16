using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Restaurants;

public sealed class GetRestaurantPicksQueryHandler
    : IRequestHandler<GetRestaurantPicksQuery, IReadOnlyList<RestaurantDto>>
{
    private readonly IAppDbContext _db;

    public GetRestaurantPicksQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<RestaurantDto>> Handle(
        GetRestaurantPicksQuery request,
        CancellationToken cancellationToken)
    {
        var query = _db.Restaurants.AsNoTracking().Where(r => r.Slot == request.Slot);
        if (request.WifeApprovedOnly) query = query.Where(r => r.WifeApproved);

        var restaurants = await query.ToListAsync(cancellationToken);

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
            .Select(r => new RestaurantDto(r.Id, r.Name, r.Style, r.Slot, r.WifeApproved, r.DriveMinutes, r.Notes))
            .ToList();
    }
}
