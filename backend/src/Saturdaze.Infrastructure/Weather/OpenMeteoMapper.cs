using Saturdaze.Application.Weather;

namespace Saturdaze.Infrastructure.Weather;

internal static class OpenMeteoMapper
{
    public static IReadOnlyList<WeatherForecast> Map(OpenMeteoResponse response, DateOnly from, DateOnly to)
    {
        var daily = response.Daily;
        if (daily is null || daily.Time.Length == 0)
            return Enumerable.Range(0, (to.DayNumber - from.DayNumber) + 1)
                .Select(i => Unavailable(from.AddDays(i)))
                .ToList();

        var byDate = new Dictionary<DateOnly, int>(daily.Time.Length);
        for (var i = 0; i < daily.Time.Length; i++)
        {
            if (DateOnly.TryParse(daily.Time[i], out var d)) byDate[d] = i;
        }

        var result = new List<WeatherForecast>();
        for (var d = from; d <= to; d = d.AddDays(1))
        {
            if (!byDate.TryGetValue(d, out var idx))
            {
                result.Add(Unavailable(d));
                continue;
            }

            var high = ArrayAt(daily.Temperature2mMax, idx);
            var low = ArrayAt(daily.Temperature2mMin, idx);
            var precip = ArrayAt(daily.PrecipitationSum, idx);
            var code = ArrayAt(daily.WeatherCode, idx);

            var tags = new List<string>();
            AddPrecipitationTag(code, precip, tags);
            AddTemperatureTag(high, tags);

            result.Add(new WeatherForecast(d, tags, high, low, precip, Unavailable: false));
        }

        return result;
    }

    public static WeatherForecast Unavailable(DateOnly date)
        => new(date, Array.Empty<string>(), null, null, null, Unavailable: true);

    private static T? ArrayAt<T>(T?[] arr, int idx) where T : struct
        => idx >= 0 && idx < arr.Length ? arr[idx] : null;

    private static void AddPrecipitationTag(int? code, double? precip, List<string> tags)
    {
        // WMO codes: 71-77, 85-86 = snow; 51-67, 80-82, 95-99 = rain.
        if (code is int c)
        {
            if ((c >= 71 && c <= 77) || c == 85 || c == 86) { tags.Add("snow"); return; }
            if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82) || (c >= 95 && c <= 99))
            {
                tags.Add("rain");
                return;
            }
            if (c == 0) tags.Add("sunny");
        }
        if (precip is double p && p >= 1.0 && !tags.Contains("rain") && !tags.Contains("snow"))
            tags.Add("rain");
    }

    private static void AddTemperatureTag(double? high, List<string> tags)
    {
        if (high is not double h) return;
        if (h < 5) tags.Add("cold");
        else if (h < 15) tags.Add("cool");
        else if (h < 22) tags.Add("mild");
        else tags.Add("warm");
    }
}
