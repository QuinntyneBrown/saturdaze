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

    /// <summary>The owner adds a member who will not sign in (L2-125).</summary>
    [HttpPost("members")]
    public async Task<ActionResult<AddFamilyMemberResultDto>> AddMember(
        [FromBody] AddFamilyMemberCommand command,
        CancellationToken ct)
        => StatusCode(StatusCodes.Status201Created, await _sender.Send(command, ct));
}
