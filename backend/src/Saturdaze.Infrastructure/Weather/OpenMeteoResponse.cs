using System.Text.Json.Serialization;

namespace Saturdaze.Infrastructure.Weather;

internal sealed class OpenMeteoResponse
{
    [JsonPropertyName("daily")] public OpenMeteoDaily? Daily { get; set; }
}

internal sealed class OpenMeteoDaily
{
    [JsonPropertyName("time")] public string[] Time { get; set; } = Array.Empty<string>();
    [JsonPropertyName("weather_code")] public int?[] WeatherCode { get; set; } = Array.Empty<int?>();
    [JsonPropertyName("temperature_2m_max")] public double?[] Temperature2mMax { get; set; } = Array.Empty<double?>();
    [JsonPropertyName("temperature_2m_min")] public double?[] Temperature2mMin { get; set; } = Array.Empty<double?>();
    [JsonPropertyName("precipitation_sum")] public double?[] PrecipitationSum { get; set; } = Array.Empty<double?>();
}
