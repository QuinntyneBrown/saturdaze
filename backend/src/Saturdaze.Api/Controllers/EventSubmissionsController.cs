using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.EventSubmissions;

namespace Saturdaze.Api.Controllers;

[ApiController]
[Route("api/events/submissions")]
[Authorize]
public sealed class EventSubmissionsController : ControllerBase
{
    private readonly ISender _sender;

    public EventSubmissionsController(ISender sender) => _sender = sender;

    public record SubmitRequest(
        string Title,
        DateTime StartsAtLocal,
        DateTime? EndsAtLocal,
        string? Location,
        string? Description,
        string? CostNote,
        string? AgeRange,
        string? SourceUrl,
        string? Category);

    public record RejectRequest(string? Reason);

    [HttpPost]
    public async Task<ActionResult<EventSubmissionDto>> Submit(
        [FromBody] SubmitRequest req,
        CancellationToken ct)
    {
        var dto = await _sender.Send(new SubmitEventCommand(
            req.Title,
            req.StartsAtLocal,
            req.EndsAtLocal,
            req.Location,
            req.Description,
            req.CostNote,
            req.AgeRange,
            req.SourceUrl,
            req.Category), ct);

        return CreatedAtAction(nameof(Mine), null, dto);
    }

    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<EventSubmissionDto>>> Mine(CancellationToken ct)
    {
        return Ok(await _sender.Send(new ListMySubmissionsQuery(), ct));
    }

    [HttpGet("pending")]
    [Authorize(Policy = "Admin")]
    public async Task<ActionResult<IReadOnlyList<EventSubmissionDto>>> Pending(CancellationToken ct)
    {
        return Ok(await _sender.Send(new ListPendingSubmissionsQuery(), ct));
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Policy = "Admin")]
    public async Task<ActionResult<EventSubmissionDto>> Approve(Guid id, CancellationToken ct)
    {
        return Ok(await _sender.Send(new ApproveSubmissionCommand(id), ct));
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize(Policy = "Admin")]
    public async Task<ActionResult<EventSubmissionDto>> Reject(
        Guid id,
        [FromBody] RejectRequest req,
        CancellationToken ct)
    {
        return Ok(await _sender.Send(new RejectSubmissionCommand(id, req?.Reason), ct));
    }
}
