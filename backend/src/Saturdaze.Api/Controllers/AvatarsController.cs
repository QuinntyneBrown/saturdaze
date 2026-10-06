using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Avatars;

namespace Saturdaze.Api.Controllers;

[ApiController]
[Route("api/avatars")]
public sealed class AvatarsController : ControllerBase
{
    private readonly ISender _sender;

    public AvatarsController(ISender sender) => _sender = sender;

    /// <summary>
    /// Anonymous capability URL: <c>&lt;img&gt;</c> cannot send a bearer (L2-008).
    /// The token changes on every upload, so the response is cached as immutable.
    /// </summary>
    [HttpGet("{token:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> Get(Guid token, CancellationToken ct)
    {
        var image = await _sender.Send(new GetAvatarQuery(token), ct);
        Response.Headers.CacheControl = "public, max-age=31536000, immutable";
        Response.Headers.XContentTypeOptions = "nosniff";
        return File(image.Data, image.ContentType);
    }
}
