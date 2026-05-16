using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Saturdaze.Application.Weather;

namespace Saturdaze.Infrastructure.Weather;

public sealed class OpenMeteoWeatherClient : IWeatherClient
{
    public const string HttpClientName = "OpenMeteo";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString
    };

    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;
    private readonly ILogger<OpenMeteoWeatherClient> _logger;
    private readonly TimeSpan _cacheTtl;

    public OpenMeteoWeatherClient(HttpClient http, IMemoryCache cache, ILogger<OpenMeteoWeatherClient> logger)
        : this(http, cache, logger, TimeSpan.FromMinutes(60)) { }

    internal OpenMeteoWeatherClient(HttpClient http, IMemoryCache cache, ILogger<OpenMeteoWeatherClient> logger, TimeSpan cacheTtl)
    {
        _http = http;
        _cache = cache;
        _logger = logger;
        _cacheTtl = cacheTtl;
    }

    public async Task<IReadOnlyList<WeatherForecast>> GetForecastAsync(
        double latitude,
        double longitude,
        DateOnly from,
        DateOnly to,
        CancellationToken cancellationToken = default)
    {
        if (to < from) throw new ArgumentException("to must be on or after from", nameof(to));

        var cacheKey = $"weather:{latitude:F4}:{longitude:F4}:{from:yyyyMMdd}:{to:yyyyMMdd}";
        if (_cache.TryGetValue(cacheKey, out IReadOnlyList<WeatherForecast>? cached) && cached is not null)
            return cached;

        var url = $"forecast?latitude={latitude.ToString("F4", CultureInfo.InvariantCulture)}"
                  + $"&longitude={longitude.ToString("F4", CultureInfo.InvariantCulture)}"
                  + $"&start_date={from:yyyy-MM-dd}&end_date={to:yyyy-MM-dd}"
                  + "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum"
                  + "&timezone=auto";

        try
        {
            using var response = await _http.GetAsync(url, cancellationToken);
            response.EnsureSuccessStatusCode();
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var payload = await JsonSerializer.DeserializeAsync<OpenMeteoResponse>(stream, JsonOptions, cancellationToken);
            var forecasts = payload is null
                ? FallbackRange(from, to)
                : OpenMeteoMapper.Map(payload, from, to);
            _cache.Set(cacheKey, forecasts, _cacheTtl);
            return forecasts;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            _logger.LogWarning(ex, "Weather provider call failed; falling back to neutral forecast.");
            return FallbackRange(from, to);
        }
    }

    private static IReadOnlyList<WeatherForecast> FallbackRange(DateOnly from, DateOnly to)
    {
        var days = new List<WeatherForecast>();
        for (var d = from; d <= to; d = d.AddDays(1))
            days.Add(OpenMeteoMapper.Unavailable(d));
        return days;
    }
}
