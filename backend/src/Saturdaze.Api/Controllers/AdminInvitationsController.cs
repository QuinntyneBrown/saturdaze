using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Admin.Invitations;

namespace Saturdaze.Api.Controllers;

/// <summary>
/// Platform invitations an administrator sends from Saturdaze Admin (L2-157,
/// L2-158). Every action requires the Admin policy on top of the
/// authenticated fallback (L2-111); business rules live in the handlers.
/// </summary>
[ApiController]
[Route("api/admin/invitations")]
[Authorize(Policy = "Admin")]
public sealed class AdminInvitationsController : ControllerBase
{
    private readonly ISender _sender;
    private readonly IConfiguration _config;

    public AdminInvitationsController(ISender sender, IConfiguration config)
    {
        _sender = sender;
        _config = config;
    }

    public sealed record SendRequest(IReadOnlyList<string>? Emails, Guid? ProspectId, string? Message);

    /// <summary>Every invitation, newest first, with its derived status (L2-158).</summary>
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<PlatformInvitationDto>>> List(CancellationToken ct)
        => Ok(await _sender.Send(new ListInvitationsQuery(), ct));

    /// <summary>
    /// One invitation per address, mailed after the response. The join link is
    /// returned to the administrator, who is entitled to send it (ADR-019).
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SendInvitationsResultDto>> Send([FromBody] SendRequest body, CancellationToken ct)
    {
        var result = await _sender.Send(
            new SendInvitationsCommand(body.Emails ?? Array.Empty<string>(), body.ProspectId, body.Message), ct);
        var appOrigin = (_config["Saturdaze:Share:AppOrigin"] ?? $"{Request.Scheme}://{Request.Host}").TrimEnd('/');
        var absolute = result with
        {
            Invitations = result.Invitations.Select(i => i with { Url = i.Url is null ? null : appOrigin + i.Url }).ToList(),
        };
        return StatusCode(StatusCodes.Status201Created, absolute);
    }

    /// <summary>Revokes a pending invitation; idempotent (L2-158).</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Revoke(Guid id, CancellationToken ct)
    {
        await _sender.Send(new RevokeInvitationCommand(id), ct);
        return NoContent();
    }
}
