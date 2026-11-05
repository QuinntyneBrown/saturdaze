using MediatR;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Dates;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Api.Controllers;

/// <summary>A couple's dates on a weekend (L2-219 → L2-223, ADR-025). Authenticated by default (ADR-008).</summary>
[ApiController]
[Route("api/weekends/{weekendId:guid}/dates")]
public sealed class DatesController : ControllerBase
{
    private readonly ISender _sender;

    public DatesController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<ActionResult<CoupleDatesDto>> List(Guid weekendId, CancellationToken ct)
        => Ok(await _sender.Send(new GetDatesQuery(weekendId), ct));

    /// <summary>Plans a date, or returns the one already on that meal and day (ADR-003).</summary>
    [HttpPost]
    public async Task<ActionResult<CoupleDateDto>> Plan(Guid weekendId, [FromBody] PlanDateRequest body, CancellationToken ct)
        => Ok(await _sender.Send(new PlanDateCommand(weekendId, body.Day, body.Meal, body.AttendeeMemberIds), ct));

    /// <summary>Moves the date to another meal or day.</summary>
    [HttpPut("{dateId:guid}")]
    public async Task<ActionResult<CoupleDateDto>> Move(Guid weekendId, Guid dateId, [FromBody] MoveDateRequest body, CancellationToken ct)
        => Ok(await _sender.Send(new ChangeDateCommand(weekendId, dateId, DateChange.Move, body.Day, body.Meal), ct));

    [HttpPost("{dateId:guid}/regenerate")]
    public async Task<ActionResult<CoupleDateDto>> Regenerate(Guid weekendId, Guid dateId, CancellationToken ct)
        => Ok(await _sender.Send(new ChangeDateCommand(weekendId, dateId, DateChange.Regenerate), ct));

    [HttpPost("{dateId:guid}/swap-restaurant")]
    public async Task<ActionResult<CoupleDateDto>> SwapRestaurant(Guid weekendId, Guid dateId, CancellationToken ct)
        => Ok(await _sender.Send(new ChangeDateCommand(weekendId, dateId, DateChange.SwapRestaurant), ct));

    [HttpPost("{dateId:guid}/swap-activity")]
    public async Task<ActionResult<CoupleDateDto>> SwapActivity(Guid weekendId, Guid dateId, CancellationToken ct)
        => Ok(await _sender.Send(new ChangeDateCommand(weekendId, dateId, DateChange.SwapActivity), ct));

    [HttpDelete("{dateId:guid}/activity")]
    public async Task<ActionResult<CoupleDateDto>> DropActivity(Guid weekendId, Guid dateId, CancellationToken ct)
        => Ok(await _sender.Send(new ChangeDateCommand(weekendId, dateId, DateChange.DropActivity), ct));

    [HttpDelete("{dateId:guid}")]
    public async Task<IActionResult> Cancel(Guid weekendId, Guid dateId, CancellationToken ct)
    {
        await _sender.Send(new CancelDateCommand(weekendId, dateId), ct);
        return NoContent();
    }
}

public sealed record PlanDateRequest(DayOfWeekend? Day, MealSlot? Meal, IReadOnlyList<Guid>? AttendeeMemberIds);

public sealed record MoveDateRequest(DayOfWeekend? Day, MealSlot? Meal);
