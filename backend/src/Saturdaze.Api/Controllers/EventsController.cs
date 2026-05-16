using MediatR;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Events;

namespace Saturdaze.Api.Controllers;

[ApiController]
[Route("api/events")]
public sealed class EventsController : ControllerBase
{
    private readonly ISender _sender;

    public EventsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LocalEventDto>>> Get(
        [FromQuery] DateOnly weekendOf,
        [FromQuery] int maxDriveMinutes = 120,
        CancellationToken ct = default)
    {
        var result = await _sender.Send(new GetLocalEventsQuery(weekendOf, maxDriveMinutes), ct);
        return Ok(result);
    }
}
