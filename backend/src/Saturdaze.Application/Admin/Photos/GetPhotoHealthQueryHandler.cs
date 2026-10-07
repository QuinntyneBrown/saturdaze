using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Photos;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Photos;

public sealed class GetPhotoHealthQueryHandler : IRequestHandler<GetPhotoHealthQuery, PhotoHealthDto>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;
    private readonly ImageOptions _images;

    public GetPhotoHealthQueryHandler(IAppDbContext db, IDateTimeProvider clock, IOptions<ImageOptions> images)
    {
        _db = db;
        _clock = clock;
        _images = images.Value;
    }

    public async Task<PhotoHealthDto> Handle(GetPhotoHealthQuery request, CancellationToken ct)
    {
        var today = _clock.Today;
        var activities = await _db.Activities.AsNoTracking().Select(a => a.Id).ToListAsync(ct);
        var restaurants = await _db.Restaurants.AsNoTracking().Select(r => r.Id).ToListAsync(ct);
        var events = await _db.LocalEvents.AsNoTracking().Where(e => e.StartsOn >= today).Select(e => e.Id).ToListAsync(ct);

        var photos = (await _db.PlacePhotos.AsNoTracking().ToListAsync(ct))
            .GroupBy(p => (p.PlaceKind, p.PlaceId))
            .ToDictionary(g => g.Key, g => g.ToList());
        var pending = photos.Values.Sum(list =>
            list.Count(p => p.Source == PhotoSource.Provider && p.ReviewState == PhotoReviewState.Unreviewed));

        return new PhotoHealthDto(
            new[]
            {
                Measure("activities", PlaceKind.Activity, activities, photos),
                Measure("restaurants", PlaceKind.Restaurant, restaurants, photos),
                Measure("upcomingEvents", PlaceKind.LocalEvent, events, photos),
            },
            pending);
    }

    /// <summary>
    /// The same <see cref="PhotoHealth"/> evaluation the Places list uses, so a flag count here
    /// equals the filtered list's total (L2-112 AC1). A blocked primary is not a projecting one (AC2).
    /// </summary>
    private CatalogPhotoHealthDto Measure(
        string catalog, PlaceKind kind, List<Guid> placeIds, Dictionary<(PlaceKind, Guid), List<PlacePhoto>> photos)
    {
        bool IsAllowed(string url) => PlacePhotoReader.IsAllowed(url, _images);
        int withPrimary = 0, noPhoto = 0, blocked = 0, unreviewed = 0, missingAlt = 0;
        foreach (var id in placeIds)
        {
            var own = photos.GetValueOrDefault((kind, id)) ?? new List<PlacePhoto>();
            var flags = PhotoHealth.Flags(own, IsAllowed);
            if (flags.Contains(PhotoHealth.NoPhoto)) noPhoto++;
            if (flags.Contains(PhotoHealth.BlockedUrl)) blocked++;
            if (flags.Contains(PhotoHealth.Unreviewed)) unreviewed++;
            if (flags.Contains(PhotoHealth.MissingAlt)) missingAlt++;
            if (!flags.Contains(PhotoHealth.NoPhoto) && !flags.Contains(PhotoHealth.BlockedUrl)) withPrimary++;
        }
        return new CatalogPhotoHealthDto(catalog, kind.ToString(), placeIds.Count, withPrimary, noPhoto, blocked, unreviewed, missingAlt);
    }
}
