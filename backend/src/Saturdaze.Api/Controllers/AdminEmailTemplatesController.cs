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

    /// <summary>One template with its content and required placeholders (L2-127).</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EmailTemplateDto>> Get(Guid id, CancellationToken ct)
        => Ok(await _sender.Send(new GetEmailTemplateQuery(id), ct));

    public record CreateTemplateRequest(string? Key, string? Name, string? Description, string? Category, Guid? DuplicateOf);

    /// <summary>A new draft from the category's starter, or a duplicate of <c>duplicateOf</c> (L2-126).</summary>
    [HttpPost]
    public async Task<ActionResult<EmailTemplateDto>> Create([FromBody] CreateTemplateRequest req, CancellationToken ct)
    {
        var dto = await _sender.Send(new CreateEmailTemplateCommand(req.Key, req.Name, req.Description, req.Category, req.DuplicateOf), ct);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);
    }
}
