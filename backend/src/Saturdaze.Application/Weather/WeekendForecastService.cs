using Microsoft.Extensions.Options;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Weather;

/// <summary>
/// The Saturday + Sunday forecast for the configured home location. Every
/// handler that returns a <c>WeekendDto</c> needs this, so it lives in one
/// place instead of being re-derived from <c>HomeLocationOptions</c> per handler.
/// </summary>
public sealed class WeekendForecastService
{
    private readonly IWeatherClient _client;
    private readonly IOptions<HomeLocationOptions> _home;

    public WeekendForecastService(IWeatherClient client, IOptions<HomeLocationOptions> home)
    {
        _client = client;
        _home = home;
    }

    public Task<IReadOnlyList<WeatherForecast>> GetAsync(DateOnly weekendOf, CancellationToken ct)
        => GetAsync(weekendOf, null, ct);

    /// <summary>The forecast at <paramref name="home"/>, or at the configured home when it is null (L2-190).</summary>
    public Task<IReadOnlyList<WeatherForecast>> GetAsync(DateOnly weekendOf, GeoLocation? home, CancellationToken ct)
        => home is null
            ? _client.GetForecastAsync(_home.Value.Latitude, _home.Value.Longitude, weekendOf, weekendOf.AddDays(1), ct)
            : _client.GetForecastAsync((double)home.Latitude, (double)home.Longitude, weekendOf, weekendOf.AddDays(1), ct);
}
