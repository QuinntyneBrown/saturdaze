using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Catalog;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Families;
using Saturdaze.Application.Photos;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Events;

public sealed class GetLocalEventsQueryHandler
    : IRequestHandler<GetLocalEventsQuery, IReadOnlyList<LocalEventDto>>
{
    /// <summary>Days after Sunday that still count as "coming soon" (L2-020).</summary>
    public const int ComingSoonDays = 14;

    private readonly IAppDbContext _db;
    /// <summary>The bound when neither the request nor a family gives one (L2-020).</summary>
    public const int DefaultMaxDriveMinutes = 120;

    private readonly IPlacePhotoReader? _photos;
    private readonly FamilyBoundariesReader? _boundaries;

    public GetLocalEventsQueryHandler(IAppDbContext db, IPlacePhotoReader? photos = null, FamilyBoundariesReader? boundaries = null)
    {
        _db = db;
        _photos = photos;
        _boundaries = boundaries;
    }

    public async Task<IReadOnlyList<LocalEventDto>> Handle(
        GetLocalEventsQuery request,
        CancellationToken cancellationToken)
    {
        var fri = request.WeekendOf.AddDays(-1);
        var sun = request.WeekendOf.AddDays(1);
        var comingSoonUntil = sun.AddDays(ComingSoonDays);

        var query = _db.LocalEvents.AsNoTracking()
            .Where(e => (e.StartsOn <= sun && e.EndsOn >= fri)
                        || (e.StartsOn > sun && e.StartsOn <= comingSoonUntil));
        // Indoor or outdoor (L2-146); an event whose setting is unknown matches neither.
        if (request.Indoor is { } indoor) query = query.Where(e => e.Indoor == indoor);

        var rows = await query.ToListAsync(cancellationToken);

        // The family's own drives and limit (L2-190, L2-191).
        var boundaries = _boundaries is null ? null : await _boundaries.ReadCurrentAsync(cancellationToken);
        if (boundaries is not null)
            foreach (var e in rows) e.DriveMinutes = boundaries.DriveMinutes(e.Geo, e.DriveMinutes);
        var limit = Math.Min(request.MaxDriveMinutes ?? boundaries?.MaxDriveMinutes ?? DefaultMaxDriveMinutes,
            boundaries?.MaxDriveMinutes ?? int.MaxValue);
        rows = rows
            .Where(e => e.DriveMinutes <= limit && boundaries?.Excludes(ThemeTagger.Of(e)) != true)
            .OrderBy(e => e.StartsOn).ThenBy(e => e.DriveMinutes).ThenBy(e => e.Name)
            .ToList();

        var photos = _photos is null
            ? new Dictionary<Guid, PlacePhotoDto>()
            : await _photos.PrimaryPhotosAsync(
                PlaceKind.LocalEvent, rows.Select(e => (e.Id, e.Name)).ToList(), cancellationToken);

        return rows
            .Select(e => new LocalEventDto(
                e.Id, e.Name, e.StartsOn, e.EndsOn, e.Location, e.DriveMinutes, e.Url, e.Category,
                LocationDto.From(e.Geo),
                photos.GetValueOrDefault(e.Id),
                e.Indoor,
                e.StartTime, e.EndTime, e.PriceTier, e.MinAge, e.MaxAge,
                ThemeTagger.Of(e)))
            .ToList();
    }
}
