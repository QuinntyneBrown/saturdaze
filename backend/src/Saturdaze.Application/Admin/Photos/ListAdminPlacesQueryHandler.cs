using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Photos;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Photos;

public sealed class ListAdminPlacesQueryHandler : IRequestHandler<ListAdminPlacesQuery, AdminPlacePageDto>
{
    private readonly IAppDbContext _db;
    private readonly ImageOptions _images;

    public ListAdminPlacesQueryHandler(IAppDbContext db, IOptions<ImageOptions> images)
    {
        _db = db;
        _images = images.Value;
    }

    public async Task<AdminPlacePageDto> Handle(ListAdminPlacesQuery request, CancellationToken ct)
    {
        var places = new List<(PlaceKind Kind, Guid Id, string Name)>();
        places.AddRange((await _db.Activities.AsNoTracking().Select(a => new { a.Id, a.Name }).ToListAsync(ct))
            .Select(a => (PlaceKind.Activity, a.Id, a.Name)));
        places.AddRange((await _db.Restaurants.AsNoTracking().Select(r => new { r.Id, r.Name }).ToListAsync(ct))
            .Select(r => (PlaceKind.Restaurant, r.Id, r.Name)));
        places.AddRange((await _db.LocalEvents.AsNoTracking().Select(e => new { e.Id, e.Name }).ToListAsync(ct))
            .Select(e => (PlaceKind.LocalEvent, e.Id, e.Name)));

        var photos = (await _db.PlacePhotos.AsNoTracking().ToListAsync(ct))
            .GroupBy(p => (p.PlaceKind, p.PlaceId))
            .ToDictionary(g => g.Key, g => g.ToList());

        var items = places
            .OrderBy(p => p.Name, StringComparer.OrdinalIgnoreCase)
            .Select(p =>
            {
                var own = photos.GetValueOrDefault((p.Kind, p.Id)) ?? new List<PlacePhoto>();
                var primary = own.FirstOrDefault(x => x.IsPrimary);
                return new AdminPlaceDto(
                    p.Kind.ToString(),
                    p.Id,
                    p.Name,
                    own.Count,
                    primary is null ? null : PlacePhotoReader.Project(primary, p.Name, _images));
            })
            .ToList();

        return new AdminPlacePageDto(items, items.Count, 1, items.Count);
    }
}
