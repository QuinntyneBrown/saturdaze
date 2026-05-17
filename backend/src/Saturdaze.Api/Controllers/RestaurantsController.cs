using MediatR;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Contracts;
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
        [FromQuery] DateOnly day,
        [FromQuery] MealSlot slot,
        [FromQuery] Guid? nearActivityId,
        [FromQuery] bool wifeApprovedOnly = true,
        [FromQuery] int take = 10,
        CancellationToken ct = default)
    {
        var result = await _sender.Send(
            new GetRestaurantPicksQuery(day, slot, nearActivityId, wifeApprovedOnly, take),
            ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/vote")]
    public async Task<ActionResult<RestaurantDto>> Vote(
        Guid id,
        [FromBody] VoteRestaurantRequest body,
        CancellationToken ct)
        => Ok(await _sender.Send(new VoteRestaurantCommand(id, body.VoterName, body.Vote), ct));

    [HttpPost("{id:guid}/lock")]
    public async Task<ActionResult<RestaurantDto>> Lock(
        Guid id,
        [FromBody] LockRestaurantRequest body,
        CancellationToken ct)
        => Ok(await _sender.Send(new LockRestaurantCommand(id, body.Day, body.Slot), ct));
}

public sealed record VoteRestaurantRequest(string VoterName, string Vote);
public sealed record LockRestaurantRequest(DayOfWeekend Day, MealSlot Slot);
