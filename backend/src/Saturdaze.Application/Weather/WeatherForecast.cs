namespace Saturdaze.Application.Weather;

/// <summary>
/// Single-day forecast in our domain language. <see cref="Tags"/> contains zero or more of
/// "sunny", "rain", "snow", "cold", "cool", "mild", "warm". <see cref="Unavailable"/> is true
/// when the upstream provider failed and the planner should treat the day as neutral.
/// </summary>
public sealed record WeatherForecast(
    DateOnly Date,
    IReadOnlyList<string> Tags,
    double? HighCelsius,
    double? LowCelsius,
    double? PrecipitationMm,
    bool Unavailable);
