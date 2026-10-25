using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Geocoding;

/// <summary>
/// Turns an address into coordinates (L2-190). One implementation today,
/// <c>NominatimGeocoder</c> in Infrastructure; tests use a fake. Returns null when
/// nothing matches; throws on an outage, which callers treat the same way.
/// </summary>
public interface IGeocoder
{
    Task<GeoLocation?> GeocodeAsync(string address, CancellationToken cancellationToken = default);
}
