using MediatR;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Weekends;

namespace Saturdaze.Api.Controllers;

[ApiController]
[Route("api/weekends")]
public sealed class WeekendsController : ControllerBase
{
    private readonly ISender _sender;

    public WeekendsController(ISender sender) => _sender = sender;

    [HttpPost("plan")]
    public async Task<ActionResult<WeekendDto>> Plan([FromBody] GenerateWeekendCommand command, CancellationToken ct)
        => Ok(await _sender.Send(command, ct));

    [HttpGet("current")]
    public async Task<ActionResult<WeekendDto>> Current(CancellationToken ct)
        => Ok(await _sender.Send(new GetCurrentWeekendQuery(), ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WeekendDto>> GetById(Guid id, CancellationToken ct)
        => Ok(await _sender.Send(new GetWeekendByIdQuery(id), ct));

    [HttpPost("{id:guid}/regenerate")]
    public async Task<ActionResult<WeekendDto>> Regenerate(Guid id, CancellationToken ct)
        => Ok(await _sender.Send(new RegenerateWeekendCommand(id), ct));

    [HttpGet("history")]
    public async Task<ActionResult<IReadOnlyList<WeekendSummaryDto>>> History(
        [FromQuery] int take = 20, CancellationToken ct = default)
        => Ok(await _sender.Send(new GetWeekendHistoryQuery(take), ct));

    [HttpPut("{id:guid}/favourite")]
    public async Task<ActionResult<WeekendDto>> Favourite(
        Guid id, [FromBody] FavouriteRequest body, CancellationToken ct)
        => Ok(await _sender.Send(new MarkFavouriteCommand(id, body.Favourite), ct));
}

public sealed record FavouriteRequest(bool Favourite);
