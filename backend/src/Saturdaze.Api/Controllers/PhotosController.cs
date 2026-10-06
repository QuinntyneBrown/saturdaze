using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Photos;

namespace Saturdaze.Api.Controllers;

/// <summary>
/// Family photos, served only through a signed, expiring URL (L2-109 AC5). Anonymous on purpose:
/// the signature is the credential, so a shared weekend's cover renders without a login (AC6).
/// </summary>
[ApiController]
[Route("api/photos")]
public sealed class PhotosController : ControllerBase
{
    private readonly IPhotoStore _store;
    private readonly IPhotoUrlSigner _signer;

    public PhotosController(IPhotoStore store, IPhotoUrlSigner signer)
    {
        _store = store;
        _signer = signer;
    }

    [HttpGet("{key}")]
    [AllowAnonymous]
    public async Task<IActionResult> Get(string key, [FromQuery] long exp, [FromQuery] string? sig, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(sig) || !_signer.IsValid(key, exp, sig)) return Forbid403();
        var photo = await _store.OpenAsync(key, ct);
        if (photo is null) return NotFound();
        Response.Headers.CacheControl = "private, max-age=300";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(photo.Content, photo.ContentType);
    }

    private ObjectResult Forbid403() => Problem(
        statusCode: StatusCodes.Status403Forbidden,
        title: "Link expired",
        detail: "This photo link is no longer valid.");
}
