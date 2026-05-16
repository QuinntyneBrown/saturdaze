using MediatR;

namespace Saturdaze.Application.Weather;

public sealed record GetWeekendWeatherQuery(DateOnly WeekendOf)
    : IRequest<IReadOnlyList<WeatherForecast>>;
