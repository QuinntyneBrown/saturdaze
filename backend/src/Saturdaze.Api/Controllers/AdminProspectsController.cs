using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Admin.Prospects;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Api.Controllers;

/// <summary>
/// Prospective families and their sample weekends (L2-159, L2-160). Every
/// action requires the Admin policy on top of the authenticated fallback
/// (L2-111); the planner rules live in the handlers and shared services.
/// </summary>
[ApiController]
[Route("api/admin/prospects")]
[Authorize(Policy = "Admin")]
public sealed class AdminProspectsController : ControllerBase
{
    private readonly ISender _sender;
    public AdminProspectsController(ISender sender) => _sender = sender;

    public sealed record CreateRequest(
        string? FamilyName,
        string? HomeLocation,
        IReadOnlyList<ProspectMemberDto>? Members,
        IReadOnlyList<string>? Likes,
        DateOnly? WeekendOf);

    public sealed record LockRequest(bool Locked);

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProspectDto>>> List(CancellationToken ct)
        => Ok(await _sender.Send(new ListProspectsQuery(), ct));

    [HttpPost]
    public async Task<ActionResult<ProspectDto>> Create([FromBody] CreateRequest body, CancellationToken ct)
    {
        var dto = await _sender.Send(new CreateProspectCommand(
            body.FamilyName ?? string.Empty,
            body.HomeLocation,
            body.Members ?? Array.Empty<ProspectMemberDto>(),
            body.Likes,
            body.WeekendOf), ct);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProspectDto>> Get(Guid id, CancellationToken ct)
        => Ok(await _sender.Send(new GetProspectQuery(id), ct));

    [HttpPost("{id:guid}/weekend/regenerate")]
    public async Task<ActionResult<WeekendDto>> Regenerate(Guid id, CancellationToken ct)
        => Ok(await _sender.Send(new RegenerateProspectWeekendCommand(id), ct));

    [HttpPost("{id:guid}/blocks/{blockId:guid}/swap")]
    public async Task<ActionResult<WeekendDto>> Swap(Guid id, Guid blockId, CancellationToken ct)
        => Ok(await _sender.Send(new SwapProspectBlockCommand(id, blockId), ct));

    [HttpPut("{id:guid}/blocks/{blockId:guid}/lock")]
    public async Task<ActionResult<WeekendDto>> Lock(Guid id, Guid blockId, [FromBody] LockRequest body, CancellationToken ct)
        => Ok(await _sender.Send(new LockProspectBlockCommand(id, blockId, body.Locked), ct));
}
