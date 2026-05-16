using MediatR;
using Microsoft.Extensions.Options;

namespace Saturdaze.Application.Weather;

public sealed class GetWeekendWeatherQueryHandler
    : IRequestHandler<GetWeekendWeatherQuery, IReadOnlyList<WeatherForecast>>
{
    private readonly IWeatherClient _client;
    private readonly IOptions<HomeLocationOptions> _home;

    public GetWeekendWeatherQueryHandler(IWeatherClient client, IOptions<HomeLocationOptions> home)
    {
        _client = client;
        _home = home;
    }

    public Task<IReadOnlyList<WeatherForecast>> Handle(GetWeekendWeatherQuery request, CancellationToken cancellationToken)
    {
        var sat = request.WeekendOf;
        var sun = sat.AddDays(1);
        return _client.GetForecastAsync(_home.Value.Latitude, _home.Value.Longitude, sat, sun, cancellationToken);
    }
}
