using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Contracts;

/// <summary>Where a catalog place is (L2-099): <c>location: { latitude, longitude, address }</c>.</summary>
public sealed record LocationDto(decimal Latitude, decimal Longitude, string Address)
{
    public static LocationDto? From(GeoLocation? geo) =>
        geo is null ? null : new LocationDto(geo.Latitude, geo.Longitude, geo.Address);
}
