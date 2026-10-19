using MediatR;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Restaurants;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Api.Controllers;

[ApiController]
[Route("api/restaurants")]
public sealed class RestaurantsController : ControllerBase
{
    private readonly ISender _sender;

    public RestaurantsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RestaurantDto>>> Get(
        [FromQuery] DateOnly? day,
        [FromQuery] MealSlot? slot,
        [FromQuery] Guid? nearActivityId,
        [FromQuery] bool wifeApprovedOnly = true,
        [FromQuery] int take = 10,
        [FromQuery] bool patioOnly = false,
        CancellationToken ct = default)
    {
        // L2-019 AC1: both are required and a missing one is named.
        if (day is null) throw new ValidationException("day", "Pick a day.");
        if (slot is null) throw new ValidationException("slot", "Pick a meal slot.");
        var result = await _sender.Send(
            new GetRestaurantPicksQuery(day.Value, slot.Value, nearActivityId, wifeApprovedOnly, take, patioOnly),
            ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/vote")]
    public async Task<ActionResult<RestaurantDto>> Vote(
        Guid id,
        [FromBody] VoteRestaurantRequest body,
        CancellationToken ct)
        => Ok(await _sender.Send(new VoteRestaurantCommand(id, body.VoterName, body.Vote, body.Day, body.Slot), ct));

    [HttpPost("{id:guid}/lock")]
    public async Task<ActionResult<RestaurantDto>> Lock(
        Guid id,
        [FromBody] LockRestaurantRequest body,
        CancellationToken ct)
        => Ok(await _sender.Send(new LockRestaurantCommand(id, body.Day, body.Slot), ct));
}

/// <summary><c>Day</c> and <c>Slot</c> say where the vote was cast, for its lock state (L2-148 AC3).</summary>
public sealed record VoteRestaurantRequest(string VoterName, string Vote, DayOfWeekend? Day = null, MealSlot? Slot = null);
public sealed record LockRestaurantRequest(DayOfWeekend Day, MealSlot Slot);
