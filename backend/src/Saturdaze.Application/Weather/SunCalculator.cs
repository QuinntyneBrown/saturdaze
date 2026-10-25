namespace Saturdaze.Application.Weather;

/// <summary>
/// Sunset at a place on a date, from the NOAA general solar position equations
/// (https://gml.noaa.gov/grad/solcalc/solareqns.PDF), in local time (L2-200). Accurate to
/// a few minutes at Saturdaze's latitudes, which is all "back before sunset" needs.
/// </summary>
public static class SunCalculator
{
    /// <summary>The sun's centre 0.833° below the horizon: refraction plus its radius.</summary>
    private const double SunsetZenithDegrees = 90.833;

    public static TimeOnly Sunset(double latitude, double longitude, DateOnly date, TimeZoneInfo zone)
    {
        var gamma = 2 * Math.PI / 365 * (date.DayOfYear - 1);
        var eqTime = 229.18 * (0.000075 + 0.001868 * Math.Cos(gamma) - 0.032077 * Math.Sin(gamma)
                               - 0.014615 * Math.Cos(2 * gamma) - 0.040849 * Math.Sin(2 * gamma));
        var decl = 0.006918 - 0.399912 * Math.Cos(gamma) + 0.070257 * Math.Sin(gamma)
                   - 0.006758 * Math.Cos(2 * gamma) + 0.000907 * Math.Sin(2 * gamma)
                   - 0.002697 * Math.Cos(3 * gamma) + 0.00148 * Math.Sin(3 * gamma);

        var lat = latitude * Math.PI / 180;
        var cosHa = Math.Cos(SunsetZenithDegrees * Math.PI / 180) / (Math.Cos(lat) * Math.Cos(decl)) - Math.Tan(lat) * Math.Tan(decl);
        var ha = Math.Acos(Math.Clamp(cosHa, -1, 1)) * 180 / Math.PI;

        // Minutes after UTC midnight; longitude is positive east.
        var utcMinutes = 720 - 4 * (longitude - ha) - eqTime;
        var utc = new DateTime(date.Year, date.Month, date.Day, 0, 0, 0, DateTimeKind.Utc).AddMinutes(utcMinutes);
        return TimeOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(utc, zone));
    }
}
