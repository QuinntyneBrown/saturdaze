using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Admin.EmailTemplates;

namespace Saturdaze.Api.Controllers;

/// <summary>
/// Saturdaze Admin's email template endpoints (L1-037). Every action requires the Admin
/// policy on top of the authenticated fallback (L2-125 AC1); business rules live in the
/// <c>Admin/EmailTemplates</c> handlers.
/// </summary>
[ApiController]
[Route("api/admin/email-templates")]
[Authorize(Policy = "Admin")]
public sealed class AdminEmailTemplatesController : ControllerBase
{
    private readonly ISender _sender;

    public AdminEmailTemplatesController(ISender sender) => _sender = sender;

    /// <summary>Every template ordered by name, filtered by category, status and a search (L2-125).</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EmailTemplateSummaryDto>>> List(
        [FromQuery] string? q, [FromQuery] string? category, [FromQuery] string? status, CancellationToken ct)
        => Ok(await _sender.Send(new ListEmailTemplatesQuery(q, category, status), ct));
}
