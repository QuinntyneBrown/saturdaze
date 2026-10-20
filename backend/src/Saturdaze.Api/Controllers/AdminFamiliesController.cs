using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Admin.Families;

namespace Saturdaze.Api.Controllers;

/// <summary>
/// Saturdaze Admin's family oversight endpoints (L1-038). Every action requires the Admin
/// policy on top of the authenticated fallback (L2-111); each family route enters that
/// family's scope so the family's own weekend rules apply unchanged (L2-158, ADR-019).
/// </summary>
[ApiController]
[Route("api/admin/families")]
[Authorize(Policy = "Admin")]
public sealed class AdminFamiliesController : ControllerBase
{
    private readonly ISender _sender;

    public AdminFamiliesController(ISender sender) => _sender = sender;

    /// <summary>Every family with its accounts and whether the upcoming weekend is planned (L2-157).</summary>
    [HttpGet]
    public async Task<ActionResult<AdminFamilyPageDto>> List([FromQuery] string? q, [FromQuery] int page, CancellationToken ct)
        => Ok(await _sender.Send(new ListAdminFamiliesQuery(q, page < 1 ? 1 : page), ct));
}
