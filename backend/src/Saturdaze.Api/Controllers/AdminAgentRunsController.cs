using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.AgentPlanning;

namespace Saturdaze.Api.Controllers;

/// <summary>
/// Agent runs for Saturdaze Admin (L2-208, L2-210): outcome, usage, cost and trace id of every draft.
/// Requires the Admin policy on top of the authenticated fallback (L2-111).
/// </summary>
[ApiController]
[Route("api/admin/agent-runs")]
[Authorize(Policy = "Admin")]
public sealed class AdminAgentRunsController : ControllerBase
{
    private readonly ISender _sender;

    public AdminAgentRunsController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<ActionResult<AgentRunsDto>> Get([FromQuery] int take = 50, CancellationToken ct = default)
        => Ok(await _sender.Send(new GetAgentRunsQuery(take), ct));
}
