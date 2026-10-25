using Saturdaze.Application.Weather;

namespace Saturdaze.Api.Tests.Support;

/// <summary>
/// Test-controlled weather client. Returns a "sunny / warm" forecast by default; tests can override.
/// </summary>
public sealed class FakeWeatherClient : IWeatherClient
{
    public Func<double, double, DateOnly, DateOnly, IReadOnlyList<WeatherForecast>> Producer { get; set; }
        = Sunny;

    /// <summary>Every (latitude, longitude) asked for, rounded to 4 places (L2-190 AC4).</summary>
    public System.Collections.Concurrent.ConcurrentBag<(double, double)> Requests { get; } = new();

    public Task<IReadOnlyList<WeatherForecast>> GetForecastAsync(
        double latitude, double longitude, DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        Requests.Add((Math.Round(latitude, 4), Math.Round(longitude, 4)));
        return Task.FromResult(Producer(latitude, longitude, from, to));
    }

    public static IReadOnlyList<WeatherForecast> Sunny(double _, double __, DateOnly from, DateOnly to)
        => Days(from, to, new[] { "sunny", "warm" }, 24, 16, 0.0);

    public static IReadOnlyList<WeatherForecast> Rainy(double _, double __, DateOnly from, DateOnly to)
        => Days(from, to, new[] { "rain", "cool" }, 9, 4, 12.0);

    private static IReadOnlyList<WeatherForecast> Days(DateOnly from, DateOnly to, string[] tags, int high, int low, double rain)
    {
        var days = new List<WeatherForecast>();
        for (var d = from; d <= to; d = d.AddDays(1))
            days.Add(new WeatherForecast(d, tags, high, low, rain, Unavailable: false));
        return days;
    }
}
