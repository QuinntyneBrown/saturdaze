using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Travel;

/// <summary>
/// One family's drive to a place, one way, from its own home (L2-190). A place's stored
/// drive time was measured from the catalog's home, so a family gets it corrected by the
/// difference between the estimates from its home and from the catalog's home: the family
/// living at the catalog's home keeps the curated time, and the estimator's city speed only
/// moves the difference. Without a stored time it is the estimate; without coordinates on
/// either end, the stored time.
/// </summary>
public static class FamilyDriveTime
{
    public static int Minutes(GeoLocation? home, GeoLocation? place, int stored, GeoLocation? measuredFrom = null)
    {
        if (home is null || place is null) return stored;
        var fromHome = Estimate(home, place);
        if (stored <= 0 || measuredFrom is null) return fromHome;
        return Math.Max(1, stored + fromHome - Estimate(measuredFrom, place));
    }

    private static int Estimate(GeoLocation from, GeoLocation to) =>
        TravelEstimator.Minutes(TravelEstimator.DistanceKm(from, to));
}
