using Saturdaze.Application.Weather;

namespace Saturdaze.Api.Tests.Support;

/// <summary>
/// Test-controlled weather client. Returns a "sunny / warm" forecast by default; tests can override.
/// </summary>
public sealed class FakeWeatherClient : IWeatherClient
{
    public Func<double, double, DateOnly, DateOnly, IReadOnlyList<WeatherForecast>> Producer { get; set; }
        = DefaultProducer;

    public Task<IReadOnlyList<WeatherForecast>> GetForecastAsync(
        double latitude, double longitude, DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
        => Task.FromResult(Producer(latitude, longitude, from, to));

    private static IReadOnlyList<WeatherForecast> DefaultProducer(double _, double __, DateOnly from, DateOnly to)
    {
        var days = new List<WeatherForecast>();
        for (var d = from; d <= to; d = d.AddDays(1))
            days.Add(new WeatherForecast(d, new[] { "sunny", "warm" }, 24, 16, 0.0, Unavailable: false));
        return days;
    }
}
