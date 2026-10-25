using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Saturdaze.Application.Geocoding;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Infrastructure.Geocoding;

/// <summary>
/// <see cref="IGeocoder"/> over OpenStreetMap Nominatim (L2-190). Used only when a family
/// saves its home or a commitment's place, so traffic is a few requests a week. The
/// usage policy asks for an identifying User-Agent (set on the named client) and at most
/// one request a second, which the gate enforces across the process.
/// </summary>
public sealed class NominatimGeocoder : IGeocoder
{
    public const string HttpClientName = "geocoder";

    private static readonly SemaphoreSlim Gate = new(1, 1);
    private static DateTimeOffset _lastRequest = DateTimeOffset.MinValue;

    private readonly HttpClient _http;
    private readonly ILogger<NominatimGeocoder> _logger;

    public NominatimGeocoder(HttpClient http, ILogger<NominatimGeocoder> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<GeoLocation?> GeocodeAsync(string address, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(address)) return null;

        await Gate.WaitAsync(cancellationToken);
        try
        {
            var wait = _lastRequest + TimeSpan.FromSeconds(1) - DateTimeOffset.UtcNow;
            if (wait > TimeSpan.Zero) await Task.Delay(wait, cancellationToken);
            _lastRequest = DateTimeOffset.UtcNow;

            var url = $"search?format=jsonv2&limit=1&countrycodes=ca&q={Uri.EscapeDataString(address.Trim())}";
            using var response = await _http.GetAsync(url, cancellationToken);
            response.EnsureSuccessStatusCode();
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);

            var first = doc.RootElement.EnumerateArray().FirstOrDefault();
            if (first.ValueKind != JsonValueKind.Object) return null;
            var lat = decimal.Parse(first.GetProperty("lat").GetString()!, CultureInfo.InvariantCulture);
            var lon = decimal.Parse(first.GetProperty("lon").GetString()!, CultureInfo.InvariantCulture);
            // The family's own wording stays the address; the coordinates are what we need.
            return new GeoLocation { Latitude = Math.Round(lat, 6), Longitude = Math.Round(lon, 6), Address = address.Trim() };
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException or FormatException)
        {
            // Logged without the address: it is the family's home (L2-209 spirit).
            _logger.LogWarning("Geocoding failed: {Error}", ex.GetType().Name);
            return null;
        }
        finally
        {
            Gate.Release();
        }
    }
}

/// <summary>For hosts and environments with geocoding off (<c>Saturdaze:Geocoding:Enabled=false</c>).</summary>
public sealed class NullGeocoder : IGeocoder
{
    public Task<GeoLocation?> GeocodeAsync(string address, CancellationToken cancellationToken = default)
        => Task.FromResult<GeoLocation?>(null);
}
