namespace Saturdaze.Infrastructure.Weather;

internal sealed class OpenMeteoResponse
{
    public OpenMeteoDaily? Daily { get; set; }
}

internal sealed class OpenMeteoDaily
{
    public string[] Time { get; set; } = Array.Empty<string>();

    public int?[] WeatherCode { get; set; } = Array.Empty<int?>();

    public double?[] Temperature2mMax { get; set; } = Array.Empty<double?>();

    public double?[] Temperature2mMin { get; set; } = Array.Empty<double?>();

    public double?[] PrecipitationSum { get; set; } = Array.Empty<double?>();
}
