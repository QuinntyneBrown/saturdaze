using MediatR;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Activities;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Api.Controllers;

[ApiController]
[Route("api/activities")]
public sealed class ActivitiesController : ControllerBase
{
    private readonly ISender _sender;

    public ActivitiesController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ActivityDto>>> Get(
        [FromQuery] bool? indoor,
        [FromQuery] int? maxDriveMinutes,
        [FromQuery] int? minAge,
        [FromQuery] int? maxAge,
        [FromQuery] string? weather,
        [FromQuery] bool tryNew = false,
        [FromQuery] int take = 50,
        CancellationToken ct = default)
    {
        var result = await _sender.Send(
            new GetActivitySuggestionsQuery(indoor, maxDriveMinutes, minAge, maxAge, weather, tryNew, take),
            ct);
        return Ok(result);
    }
}
