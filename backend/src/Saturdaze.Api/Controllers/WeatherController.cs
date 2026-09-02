using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Weather;

namespace Saturdaze.Api.Controllers;

[ApiController]
[Route("api/weather")]
public sealed class WeatherController : ControllerBase
{
    private readonly ISender _sender;

    public WeatherController(ISender sender) => _sender = sender;

    /// <summary>Public: the forecast carries no PII (L2-008).</summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<WeatherForecast>>> Get(
        [FromQuery] DateOnly weekendOf,
        CancellationToken ct)
        => Ok(await _sender.Send(new GetWeekendWeatherQuery(weekendOf), ct));
}
