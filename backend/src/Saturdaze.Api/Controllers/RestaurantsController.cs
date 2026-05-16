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
}
