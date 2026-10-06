using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Photos;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Photos;

public sealed class ListAdminPlacesQueryHandler : IRequestHandler<ListAdminPlacesQuery, AdminPlacePageDto>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;
    private readonly ImageOptions _images;

    public ListAdminPlacesQueryHandler(IAppDbContext db, IDateTimeProvider clock, IOptions<ImageOptions> images)
    {
        _db = db;
        _clock = clock;
        _images = images.Value;
    }

    private sealed record Place(PlaceKind Kind, Guid Id, string Name, DateOnly? StartsOn);

    public async Task<AdminPlacePageDto> Handle(ListAdminPlacesQuery request, CancellationToken ct)
    {
        var kind = request.Kind is null ? (PlaceKind?)null : Enum.Parse<PlaceKind>(request.Kind, true);
        var source = request.Source is null ? (PhotoSource?)null : Enum.Parse<PhotoSource>(request.Source, true);

        var places = await LoadPlacesAsync(kind, ct);
        if (request.Upcoming)
        {
            var today = _clock.Today;
            places = places.Where(p => p.Kind != PlaceKind.LocalEvent || p.StartsOn >= today).ToList();
        }
        if (!string.IsNullOrWhiteSpace(request.Q))
        {
            var q = request.Q.Trim();
            places = places.Where(p => p.Name.Contains(q, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        var photos = (await _db.PlacePhotos.AsNoTracking().ToListAsync(ct))
            .GroupBy(p => (p.PlaceKind, p.PlaceId))
            .ToDictionary(g => g.Key, g => g.ToList());
        bool IsAllowed(string url) => PlacePhotoReader.IsAllowed(url, _images);

        var rows = places.Select(p =>
        {
            var own = photos.GetValueOrDefault((p.Kind, p.Id)) ?? new List<PlacePhoto>();
            var primary = own.FirstOrDefault(x => x.IsPrimary);
            var flags = PhotoHealth.Flags(own, IsAllowed);
            var dto = new AdminPlaceDto(
                p.Kind.ToString(),
                p.Id,
                p.Name,
                own.Count,
                primary is null ? null : PlacePhotoReader.Project(primary, p.Name, _images),
                flags,
                own.Max(x => x.UpdatedAt));
            return (Dto: dto, Primary: primary, Severity: PhotoHealth.Severity(flags));
        });

        if (request.Flag is not null) rows = rows.Where(r => r.Dto.Flags.Contains(request.Flag));
        if (source is not null) rows = rows.Where(r => r.Primary?.Source == source);

        var ordered = (request.Sort ?? "health") switch
        {
            "name" => rows.OrderBy(r => r.Dto.Name, StringComparer.OrdinalIgnoreCase),
            "changed" => rows.OrderByDescending(r => r.Dto.UpdatedAt ?? DateTimeOffset.MinValue)
                .ThenBy(r => r.Dto.Name, StringComparer.OrdinalIgnoreCase),
            _ => rows.OrderBy(r => r.Severity).ThenBy(r => r.Dto.Name, StringComparer.OrdinalIgnoreCase),
        };

        var all = ordered.Select(r => r.Dto).ToList();
        var items = all.Skip((request.Page - 1) * ListAdminPlacesQuery.PageSize).Take(ListAdminPlacesQuery.PageSize).ToList();
        return new AdminPlacePageDto(items, all.Count, request.Page, ListAdminPlacesQuery.PageSize);
    }

    private async Task<List<Place>> LoadPlacesAsync(PlaceKind? kind, CancellationToken ct)
    {
        var places = new List<Place>();
        if (kind is null or PlaceKind.Activity)
            places.AddRange((await _db.Activities.AsNoTracking().Select(a => new { a.Id, a.Name }).ToListAsync(ct))
                .Select(a => new Place(PlaceKind.Activity, a.Id, a.Name, null)));
        if (kind is null or PlaceKind.Restaurant)
            places.AddRange((await _db.Restaurants.AsNoTracking().Select(r => new { r.Id, r.Name }).ToListAsync(ct))
                .Select(r => new Place(PlaceKind.Restaurant, r.Id, r.Name, null)));
        if (kind is null or PlaceKind.LocalEvent)
            places.AddRange((await _db.LocalEvents.AsNoTracking().Select(e => new { e.Id, e.Name, e.StartsOn }).ToListAsync(ct))
                .Select(e => new Place(PlaceKind.LocalEvent, e.Id, e.Name, e.StartsOn)));
        return places;
    }
}
