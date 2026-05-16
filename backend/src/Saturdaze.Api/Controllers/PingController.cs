using MediatR;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Pipeline;

namespace Saturdaze.Api.Controllers;

[ApiController]
[Route("api/_ping")]
public sealed class PingController : ControllerBase
{
    private readonly ISender _sender;

    public PingController(ISender sender) => _sender = sender;

    [HttpPost]
    public async Task<ActionResult<PingResponse>> Post([FromBody] PingCommand command, CancellationToken ct)
    {
        var response = await _sender.Send(command, ct);
        return Ok(response);
    }
}
