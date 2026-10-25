using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Travel;

/// <summary>
/// One family's drive to a place, one way, from its own home (L2-190). Falls back to the
/// place's stored drive time when either end has no coordinates.
/// </summary>
public static class FamilyDriveTime
{
    public static int Minutes(GeoLocation? home, GeoLocation? place, int stored) =>
        home is null || place is null ? stored : TravelEstimator.Minutes(TravelEstimator.DistanceKm(home, place));
}
