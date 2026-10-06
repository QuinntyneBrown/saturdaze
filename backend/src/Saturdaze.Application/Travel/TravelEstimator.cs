using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Travel;

/// <summary>
/// Road distance and drive time between two points, estimated from coordinates (L2-090):
/// great-circle distance times a road factor, at an average urban/highway speed. A routing
/// provider may replace this without changing its callers.
/// </summary>
public static class TravelEstimator
{
    /// <summary>Assumed ratio of road distance to straight-line distance.</summary>
    public const double RoadFactor = 1.3;

    /// <summary>Assumed average driving speed in km/h for legs with no scheduled drive.</summary>
    public const double AverageSpeedKmh = 50;

    private const double EarthRadiusKm = 6371.0;

    public static decimal DistanceKm(GeoLocation from, GeoLocation to)
    {
        var lat1 = ToRadians((double)from.Latitude);
        var lat2 = ToRadians((double)to.Latitude);
        var dLat = lat2 - lat1;
        var dLng = ToRadians((double)(to.Longitude - from.Longitude));
        var h = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                + Math.Cos(lat1) * Math.Cos(lat2) * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        var straight = 2 * EarthRadiusKm * Math.Asin(Math.Min(1, Math.Sqrt(h)));
        return Math.Max(0.1m, Math.Round((decimal)(straight * RoadFactor), 1));
    }

    public static int Minutes(decimal distanceKm) =>
        Math.Max(1, (int)Math.Round((double)distanceKm / AverageSpeedKmh * 60));

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;
}
