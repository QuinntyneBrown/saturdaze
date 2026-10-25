using System.Collections.Concurrent;
using Saturdaze.Application.Geocoding;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Api.Tests.Support;

/// <summary>Answers addresses a test registered; anything else is unknown (L2-190).</summary>
public sealed class FakeGeocoder : IGeocoder
{
    private readonly ConcurrentDictionary<string, GeoLocation> _known = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>When set, every lookup fails as an outage would.</summary>
    public bool Fail { get; set; }

    /// <summary>How long each lookup takes; tests of the time budget raise it.</summary>
    public TimeSpan Delay { get; set; } = TimeSpan.Zero;

    public int Calls;

    public void Add(string address, decimal latitude, decimal longitude) =>
        _known[address.Trim()] = new GeoLocation { Latitude = latitude, Longitude = longitude, Address = address.Trim() };

    public async Task<GeoLocation?> GeocodeAsync(string address, CancellationToken cancellationToken = default)
    {
        Interlocked.Increment(ref Calls);
        if (Delay > TimeSpan.Zero) await Task.Delay(Delay, cancellationToken);
        if (Fail) throw new HttpRequestException("geocoder unavailable");
        return _known.TryGetValue(address.Trim(), out var hit) ? hit.Copy() : null;
    }
}
