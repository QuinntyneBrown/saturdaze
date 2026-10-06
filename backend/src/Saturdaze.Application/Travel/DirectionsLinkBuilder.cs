using System.Globalization;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Travel;

/// <summary>
/// External directions for a leg (L2-102 AC3, AC6): Google Maps' public URL scheme, carrying
/// only the two coordinate pairs and the travel mode — never a family, weekend or block id.
/// </summary>
public static class DirectionsLinkBuilder
{
    /// <summary>Legs this short get no directions link.</summary>
    public const int MinimumMinutes = 10;

    public static string? Build(GeoLocation from, GeoLocation to, int minutes) =>
        minutes <= MinimumMinutes
            ? null
            : "https://www.google.com/maps/dir/?api=1"
              + $"&origin={Coordinate(from)}&destination={Coordinate(to)}&travelmode=driving";

    private static string Coordinate(GeoLocation p) =>
        Uri.EscapeDataString(string.Create(CultureInfo.InvariantCulture, $"{p.Latitude:0.######},{p.Longitude:0.######}"));
}
