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

    /// <summary>The largest body a save or preview accepts: the 100 000 + 50 000 character bodies and sample data, as UTF-8 JSON.</summary>
    private const long ContentRequestLimit = 1024 * 1024;

    public record SaveTemplateRequest(
        string? Name, string? Description, string? Subject, string? Preheader,
        string? HtmlBody, string? TextBody, Dictionary<string, string>? SampleData, int Version);

    /// <summary>Saves the content when <c>version</c> is current (L2-127).</summary>
    [HttpPut("{id:guid}")]
    [RequestSizeLimit(ContentRequestLimit)]
    public async Task<ActionResult<EmailTemplateDto>> Save(Guid id, [FromBody] SaveTemplateRequest req, CancellationToken ct)
        => Ok(await _sender.Send(new SaveEmailTemplateCommand(
            id, req.Name, req.Description, req.Subject, req.Preheader, req.HtmlBody, req.TextBody, req.SampleData, req.Version), ct));

    public record PreviewRequest(
        string? Subject, string? Preheader, string? HtmlBody, string? TextBody, Dictionary<string, string>? SampleData);

    /// <summary>Renders unsaved content with sample data; nothing is saved (L2-128).</summary>
    [HttpPost("preview")]
    [RequestSizeLimit(ContentRequestLimit)]
    public async Task<ActionResult<EmailPreviewDto>> Preview([FromBody] PreviewRequest req, CancellationToken ct)
        => Ok(await _sender.Send(new PreviewEmailTemplateQuery(req.Subject, req.Preheader, req.HtmlBody, req.TextBody, req.SampleData), ct));

    public record StatusRequest(string? Status, int Version);

    /// <summary>Activates, archives or restores a template as a draft; a system template stays active (L2-129).</summary>
    [HttpPost("{id:guid}/status")]
    public async Task<ActionResult<EmailTemplateDto>> SetStatus(Guid id, [FromBody] StatusRequest req, CancellationToken ct)
        => Ok(await _sender.Send(new ChangeEmailTemplateStatusCommand(id, req.Status, req.Version), ct));

    /// <summary>Deletes a non-system template and its revisions (L2-129).</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _sender.Send(new DeleteEmailTemplateCommand(id), ct);
        return NoContent();
    }
}
