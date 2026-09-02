using MediatR;

namespace Saturdaze.Application.Weather;

public sealed class GetWeekendWeatherQueryHandler
    : IRequestHandler<GetWeekendWeatherQuery, IReadOnlyList<WeatherForecast>>
{
    private readonly WeekendForecastService _forecast;

    public GetWeekendWeatherQueryHandler(WeekendForecastService forecast) => _forecast = forecast;

    public Task<IReadOnlyList<WeatherForecast>> Handle(GetWeekendWeatherQuery request, CancellationToken cancellationToken)
        => _forecast.GetAsync(request.WeekendOf, cancellationToken);
}
