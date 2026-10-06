namespace Saturdaze.Domain.ValueObjects;

/// <summary>
/// Where a place is: WGS84 coordinates plus a display address (L2-099).
/// Stored as an owned value; null on a place until it is captured or backfilled.
/// </summary>
public sealed class GeoLocation
{
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public string Address { get; set; } = string.Empty;

    /// <summary>A location from optional parts, or null when either coordinate is missing.</summary>
    public static GeoLocation? From(decimal? latitude, decimal? longitude, string? address) =>
        latitude is { } lat && longitude is { } lng
            ? new GeoLocation { Latitude = lat, Longitude = lng, Address = address?.Trim() ?? string.Empty }
            : null;

    /// <summary>A detached copy: an owned value cannot be shared between two owners.</summary>
    public GeoLocation Copy() => new() { Latitude = Latitude, Longitude = Longitude, Address = Address };

    public bool SameAs(GeoLocation? other) =>
        other is not null && other.Latitude == Latitude && other.Longitude == Longitude && other.Address == Address;

    /// <summary>
    /// Keeps <paramref name="current"/> when <paramref name="next"/> carries the same values, so
    /// re-seeding or re-ingesting does not churn the owned row; a null <paramref name="next"/> keeps what is there.
    /// </summary>
    public static GeoLocation? Merge(GeoLocation? current, GeoLocation? next) =>
        next is null || next.SameAs(current) ? current : next;
}
