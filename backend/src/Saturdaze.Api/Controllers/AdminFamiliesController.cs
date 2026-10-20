using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Admin.Families;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Enums;

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

    /// <summary>Regenerates the whole weekend; locked blocks and commitments stay (L2-160 AC1).</summary>
    [HttpPost("{familyId:guid}/weekends/{id:guid}/regenerate")]
    public async Task<ActionResult<WeekendDto>> Regenerate(Guid familyId, Guid id, CancellationToken ct)
        => Ok(await _sender.Send(new RegenerateAdminFamilyWeekendCommand(familyId, id), ct));

    /// <summary>Regenerates one day; the other is untouched (L2-160 AC6).</summary>
    [HttpPost("{familyId:guid}/weekends/{id:guid}/days/{day}/regenerate")]
    public async Task<ActionResult<WeekendDto>> RegenerateDay(Guid familyId, Guid id, string day, CancellationToken ct)
        => Ok(await _sender.Send(new RegenerateAdminFamilyDayCommand(familyId, id, ParseDay(day)), ct));

    /// <summary>Locks or unlocks every lockable block of a day.</summary>
    [HttpPut("{familyId:guid}/weekends/{id:guid}/days/{day}/lock")]
    public async Task<ActionResult<WeekendDto>> LockDay(Guid familyId, Guid id, string day, [FromBody] LockDayRequest body, CancellationToken ct)
        => Ok(await _sender.Send(new LockAdminFamilyDayCommand(familyId, id, ParseDay(day), body.Locked), ct));

    /// <summary>Locks or unlocks one block; a commitment cannot be unlocked (L2-160 AC3).</summary>
    [HttpPut("{familyId:guid}/blocks/{blockId:guid}/lock")]
    public async Task<ActionResult<WeekendDto>> LockBlock(Guid familyId, Guid blockId, [FromBody] LockBlockRequest body, CancellationToken ct)
        => Ok(await _sender.Send(new LockAdminFamilyBlockCommand(familyId, blockId, body.Locked), ct));

    /// <summary>Swaps an unlocked activity for another suggestion (L2-160 AC4, AC5).</summary>
    [HttpPost("{familyId:guid}/blocks/{blockId:guid}/swap")]
    public async Task<ActionResult<WeekendDto>> SwapBlock(Guid familyId, Guid blockId, [FromBody] SwapBlockRequest? body, CancellationToken ct)
        => Ok(await _sender.Send(new SwapAdminFamilyBlockCommand(familyId, blockId, body?.RejectedActivityIds), ct));

    /// <summary>Every administrator change to the family's weekends, newest first (L2-161).</summary>
    [HttpGet("{familyId:guid}/weekend-changes")]
    public async Task<ActionResult<WeekendChangePageDto>> Changes(Guid familyId, [FromQuery] int page, CancellationToken ct)
        => Ok(await _sender.Send(new ListWeekendChangesQuery(familyId, page < 1 ? 1 : page), ct));

    private static DayOfWeekend ParseDay(string value)
        => Enum.TryParse<DayOfWeekend>(value, ignoreCase: true, out var day)
            ? day
            : throw new ValidationException("day", "Day must be Saturday or Sunday.");
}
