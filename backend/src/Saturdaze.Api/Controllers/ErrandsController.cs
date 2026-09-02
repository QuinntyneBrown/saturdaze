using MediatR;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Errands;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Api.Controllers;

[ApiController]
public sealed class ErrandsController : ControllerBase
{
    private readonly ISender _sender;
    public ErrandsController(ISender sender) => _sender = sender;

    [HttpPost("api/weekends/{weekendId:guid}/errands")]
    public async Task<ActionResult<WeekendDto>> Add(
        Guid weekendId,
        [FromBody] AddErrandRequest body,
        CancellationToken ct)
        => Ok(await _sender.Send(
            new AddShoppingErrandCommand(weekendId, body.Description, body.EstimatedMinutes, body.PreferredDay), ct));

    [HttpPut("api/errands/{id:guid}/done")]
    public async Task<ActionResult<WeekendDto>> SetDone(
        Guid id,
        [FromBody] ErrandDoneRequest body,
        CancellationToken ct)
        => Ok(await _sender.Send(new MarkErrandDoneCommand(id, body.Done), ct));
}

public sealed record AddErrandRequest(string Description, int EstimatedMinutes, DayOfWeekend? PreferredDay = null);
public sealed record ErrandDoneRequest(bool Done);
