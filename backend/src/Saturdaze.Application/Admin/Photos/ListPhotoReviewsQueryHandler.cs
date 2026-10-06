using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Photos;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Photos;

public sealed class ListPhotoReviewsQueryHandler : IRequestHandler<ListPhotoReviewsQuery, IReadOnlyList<PhotoReviewItemDto>>
{
    private readonly IAppDbContext _db;
    private readonly ImageOptions _images;

    public ListPhotoReviewsQueryHandler(IAppDbContext db, IOptions<ImageOptions> images)
    {
        _db = db;
        _images = images.Value;
    }

    public async Task<IReadOnlyList<PhotoReviewItemDto>> Handle(ListPhotoReviewsQuery request, CancellationToken ct)
    {
        var pending = await _db.PlacePhotos.AsNoTracking()
            .Where(p => p.Source == PhotoSource.Provider && p.ReviewState == PhotoReviewState.Unreviewed)
            .ToListAsync(ct);
        if (pending.Count == 0) return Array.Empty<PhotoReviewItemDto>();

        var placeIds = pending.Select(p => p.PlaceId).Distinct().ToList();
        var primaries = await _db.PlacePhotos.AsNoTracking()
            .Where(p => p.IsPrimary && placeIds.Contains(p.PlaceId))
            .ToListAsync(ct);

        var names = new Dictionary<(PlaceKind, Guid), string>();
        foreach (var photo in pending)
        {
            var key = (photo.PlaceKind, photo.PlaceId);
            if (names.ContainsKey(key)) continue;
            names[key] = await PlaceLookup.NameAsync(_db, photo.PlaceKind, photo.PlaceId, ct) ?? "Removed place";
        }

        // Newest first: the latest change, then the row order as a stable fallback.
        return pending
            .OrderByDescending(p => p.UpdatedAt ?? DateTimeOffset.MinValue)
            .ThenByDescending(p => p.Id)
            .Select(photo =>
            {
                var name = names[(photo.PlaceKind, photo.PlaceId)];
                var current = primaries.FirstOrDefault(p => p.PlaceKind == photo.PlaceKind && p.PlaceId == photo.PlaceId && p.Id != photo.Id);
                return new PhotoReviewItemDto(
                    AdminPhotoDto.From(photo, _images),
                    photo.PlaceKind.ToString(),
                    photo.PlaceId,
                    name,
                    current is null ? null : PlacePhotoReader.Project(current, name, _images));
            })
            .ToList();
    }
}
