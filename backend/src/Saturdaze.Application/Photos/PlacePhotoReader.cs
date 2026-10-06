using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Photos;

public sealed class PlacePhotoReader : IPlacePhotoReader
{
    private readonly IAppDbContext _db;
    private readonly ImageOptions _options;

    public PlacePhotoReader(IAppDbContext db, IOptions<ImageOptions> options)
    {
        _db = db;
        _options = options.Value;
    }

    public async Task<IReadOnlyDictionary<Guid, PlacePhotoDto>> PrimaryPhotosAsync(
        PlaceKind kind,
        IReadOnlyCollection<(Guid Id, string Name)> places,
        CancellationToken ct)
    {
        if (places.Count == 0) return new Dictionary<Guid, PlacePhotoDto>();

        var ids = places.Select(p => p.Id).ToList();
        var photos = await _db.PlacePhotos.AsNoTracking()
            .Where(p => p.PlaceKind == kind && p.IsPrimary && ids.Contains(p.PlaceId))
            .ToListAsync(ct);

        var names = places.ToDictionary(p => p.Id, p => p.Name);
        var result = new Dictionary<Guid, PlacePhotoDto>();
        foreach (var photo in photos)
        {
            var dto = Project(photo, names[photo.PlaceId], _options);
            if (dto is not null) result[photo.PlaceId] = dto;
        }

        return result;
    }

    /// <summary>
    /// The photo as served to clients, or null when its URL is not HTTPS on an allowed
    /// origin (L2-089 AC3). Empty alt text becomes "Photo of {place}" (L2-088 AC4).
    /// </summary>
    public static PlacePhotoDto? Project(PlacePhoto photo, string placeName, ImageOptions options)
    {
        if (!IsAllowed(photo.Url, options)) return null;
        var alt = string.IsNullOrWhiteSpace(photo.AltText) ? $"Photo of {placeName}" : photo.AltText;
        return new PlacePhotoDto(photo.Url, photo.Width, photo.Height, alt, photo.Attribution);
    }

    private static bool IsAllowed(string url, ImageOptions options)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps) return false;
        var origin = uri.GetLeftPart(UriPartial.Authority);
        return options.AllowedOrigins.Any(o => string.Equals(o.TrimEnd('/'), origin, StringComparison.OrdinalIgnoreCase));
    }
}
