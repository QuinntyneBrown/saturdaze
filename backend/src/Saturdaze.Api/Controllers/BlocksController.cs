using MediatR;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Blocks;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Api.Controllers;

[ApiController]
[Route("api/blocks")]
public sealed class BlocksController : ControllerBase
{
    private readonly ISender _sender;
    public BlocksController(ISender sender) => _sender = sender;

    [HttpPost("{id:guid}/swap")]
    public async Task<ActionResult<WeekendDto>> Swap(
        Guid id,
        [FromBody] SwapBlockRequest? body,
        CancellationToken ct)
        => Ok(await _sender.Send(new SwapBlockCommand(id, body?.RejectedActivityIds), ct));

    [HttpPut("{id:guid}/lock")]
    public async Task<ActionResult<WeekendDto>> Lock(
        Guid id,
        [FromBody] LockBlockRequest body,
        CancellationToken ct)
        => Ok(await _sender.Send(new LockBlockCommand(id, body.Locked), ct));
}

public sealed record SwapBlockRequest(IReadOnlyList<Guid>? RejectedActivityIds);
public sealed record LockBlockRequest(bool Locked);
