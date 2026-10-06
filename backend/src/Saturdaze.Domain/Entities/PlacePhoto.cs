using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

/// <summary>
/// A licensed image of a catalog place, kept with its provenance (L2-100).
/// <see cref="PlaceKind"/> + <see cref="PlaceId"/> address the owning row because
/// the three catalogs live in separate tables. A place has at most one primary photo.
/// </summary>
public class PlacePhoto
{
    public Guid Id { get; set; }
    public PlaceKind PlaceKind { get; set; }
    public Guid PlaceId { get; set; }
    public string Url { get; set; } = string.Empty;
    public int Width { get; set; }
    public int Height { get; set; }
    public string AltText { get; set; } = string.Empty;
    public string Attribution { get; set; } = string.Empty;
    public PhotoSource Source { get; set; }
    public string License { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }

    /// <summary>A new photo, or null when attribution or licence is missing: such a photo is never stored.</summary>
    public static PlacePhoto? Create(
        PlaceKind kind,
        Guid placeId,
        string url,
        int width,
        int height,
        string? altText,
        string? attribution,
        PhotoSource source,
        string? license,
        bool primary)
    {
        if (string.IsNullOrWhiteSpace(attribution) || string.IsNullOrWhiteSpace(license)) return null;
        if (string.IsNullOrWhiteSpace(url)) return null;

        return new PlacePhoto
        {
            Id = Guid.NewGuid(),
            PlaceKind = kind,
            PlaceId = placeId,
            Url = url.Trim(),
            Width = width,
            Height = height,
            AltText = altText?.Trim() ?? string.Empty,
            Attribution = attribution.Trim(),
            Source = source,
            License = license.Trim(),
            IsPrimary = primary,
        };
    }
}
