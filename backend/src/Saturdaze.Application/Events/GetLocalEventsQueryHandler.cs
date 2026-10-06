using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Photos;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Events;

public sealed class GetLocalEventsQueryHandler
    : IRequestHandler<GetLocalEventsQuery, IReadOnlyList<LocalEventDto>>
{
    /// <summary>Days after Sunday that still count as "coming soon" (L2-020).</summary>
    public const int ComingSoonDays = 14;

    private readonly IAppDbContext _db;
    private readonly IPlacePhotoReader? _photos;

    public GetLocalEventsQueryHandler(IAppDbContext db, IPlacePhotoReader? photos = null)
    {
        _db = db;
        _photos = photos;
    }

    public async Task<IReadOnlyList<LocalEventDto>> Handle(
        GetLocalEventsQuery request,
        CancellationToken cancellationToken)
    {
        var fri = request.WeekendOf.AddDays(-1);
        var sun = request.WeekendOf.AddDays(1);
        var comingSoonUntil = sun.AddDays(ComingSoonDays);

        var rows = await _db.LocalEvents.AsNoTracking()
            .Where(e => e.DriveMinutes <= request.MaxDriveMinutes
                        && ((e.StartsOn <= sun && e.EndsOn >= fri)
                            || (e.StartsOn > sun && e.StartsOn <= comingSoonUntil)))
            .OrderBy(e => e.StartsOn).ThenBy(e => e.DriveMinutes).ThenBy(e => e.Name)
            .ToListAsync(cancellationToken);

        var photos = _photos is null
            ? new Dictionary<Guid, PlacePhotoDto>()
            : await _photos.PrimaryPhotosAsync(
                PlaceKind.LocalEvent, rows.Select(e => (e.Id, e.Name)).ToList(), cancellationToken);

        return rows
            .Select(e => new LocalEventDto(
                e.Id, e.Name, e.StartsOn, e.EndsOn, e.Location, e.DriveMinutes, e.Url, e.Category,
                LocationDto.From(e.Geo),
                photos.GetValueOrDefault(e.Id)))
            .ToList();
    }
}
