using MediatR;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Families;

namespace Saturdaze.Api.Controllers;

[ApiController]
[Route("api/family")]
public sealed class FamilyController : ControllerBase
{
    private readonly ISender _sender;

    public FamilyController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<ActionResult<FamilyProfileDto>> Get(CancellationToken ct)
        => Ok(await _sender.Send(new GetFamilyProfileQuery(), ct));

    [HttpPut]
    public async Task<ActionResult<FamilyProfileDto>> Save(
        [FromBody] SaveFamilyProfileCommand command,
        CancellationToken ct)
        => Ok(await _sender.Send(command, ct));

    /// <summary>
    /// The owner adds a member who will not sign in (L2-125), or invites them
    /// to sign in when an email is given (L2-126). The invite link is returned
    /// to the owner, who shares it (ADR-016).
    /// </summary>
    [HttpPost("members")]
    public async Task<ActionResult<AddFamilyMemberResultDto>> AddMember(
        [FromBody] AddFamilyMemberCommand command,
        [FromServices] IConfiguration config,
        CancellationToken ct)
    {
        var result = await _sender.Send(command, ct);
        if (result.Invite is { } invite)
        {
            var appOrigin = (config["Saturdaze:Share:AppOrigin"] ?? $"{Request.Scheme}://{Request.Host}").TrimEnd('/');
            result = result with { Invite = invite with { Url = appOrigin + invite.Url } };
        }
        return StatusCode(StatusCodes.Status201Created, result);
    }
}
