using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Admin.Families;
using Saturdaze.Application.Contracts;

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

    /// <summary>One family with its members and commitments (L2-159).</summary>
    [HttpGet("{familyId:guid}")]
    public async Task<ActionResult<AdminFamilyDetailDto>> Get(Guid familyId, CancellationToken ct)
        => Ok(await _sender.Send(new GetAdminFamilyQuery(familyId), ct));

    /// <summary>The family's upcoming weekend as the family sees it; 404 <c>weekend_not_planned</c> when none (L2-159 AC1).</summary>
    [HttpGet("{familyId:guid}/weekends/current")]
    public async Task<ActionResult<WeekendDto>> CurrentWeekend(Guid familyId, CancellationToken ct)
        => Ok(await _sender.Send(new GetAdminFamilyWeekendQuery(familyId), ct));

    /// <summary>Plans the family's upcoming Saturday; idempotent (L2-159 AC2, ADR-003).</summary>
    [HttpPost("{familyId:guid}/weekends/plan")]
    public async Task<ActionResult<WeekendDto>> Plan(Guid familyId, CancellationToken ct)
        => Ok(await _sender.Send(new PlanAdminFamilyWeekendCommand(familyId), ct));

    /// <summary>The family's past weekends, newest first (L2-159 AC6).</summary>
    [HttpGet("{familyId:guid}/weekends/history")]
    public async Task<ActionResult<IReadOnlyList<WeekendSummaryDto>>> History(
        Guid familyId, [FromQuery] int take = 20, CancellationToken ct = default)
    {
        var page = await _sender.Send(new GetAdminFamilyHistoryQuery(familyId, take), ct);
        Response.Headers["X-Total-Count"] = page.TotalCount.ToString(System.Globalization.CultureInfo.InvariantCulture);
        return Ok(page.Items);
    }
}
