namespace Saturdaze.Application.Weather;

public interface IWeatherClient
{
    Task<IReadOnlyList<WeatherForecast>> GetForecastAsync(
        double latitude,
        double longitude,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default);
}
