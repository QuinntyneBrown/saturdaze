using MediatR;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Weather;

namespace Saturdaze.Api.Controllers;

[ApiController]
[Route("api/weather")]
public sealed class WeatherController : ControllerBase
{
    private readonly ISender _sender;

    public WeatherController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<WeatherForecast>>> Get(
        [FromQuery] DateOnly weekendOf,
        CancellationToken ct)
        => Ok(await _sender.Send(new GetWeekendWeatherQuery(weekendOf), ct));
}
