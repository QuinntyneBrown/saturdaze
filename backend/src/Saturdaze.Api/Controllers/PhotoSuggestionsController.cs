using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Photos;
using Saturdaze.Application.PhotoSuggestions;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Api.Controllers;

/// <summary>
/// Photo suggestions (L2-157): a signed-in search that asks Claude and returns cleaned, signed
/// previews, and the anonymous preview route the dialogs load tiles from. The signature is the
/// preview's credential, as it is for family photos.
/// </summary>
[ApiController]
[Route("api/photo-suggestions")]
public sealed class PhotoSuggestionsController : ControllerBase
{
    private readonly ISender _sender;
    private readonly IPhotoSuggestionStore _store;
    private readonly IPhotoUrlSigner _signer;

    public PhotoSuggestionsController(ISender sender, IPhotoSuggestionStore store, IPhotoUrlSigner signer)
    {
        _sender = sender;
        _store = store;
        _signer = signer;
    }

    /// <summary>Body of <c>POST /api/photo-suggestions</c>.</summary>
    public sealed record FindRequest(string? Target, Guid? WeekendId, string? Kind, Guid? PlaceId, string? Query);

    [HttpPost]
    public async Task<ActionResult<PhotoSuggestionsDto>> Find([FromBody] FindRequest req, CancellationToken ct)
    {
        PlaceKind? kind = null;
        if (!string.IsNullOrWhiteSpace(req.Kind))
        {
            if (!Enum.TryParse<PlaceKind>(req.Kind, true, out var parsed))
                throw new ValidationException("kind", "Kind must be Activity, Restaurant or LocalEvent.");
            kind = parsed;
        }
        return Ok(await _sender.Send(new FindPhotoSuggestionsCommand(req.Target, req.WeekendId, kind, req.PlaceId, req.Query), ct));
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public IActionResult Preview(string id, [FromQuery] long exp, [FromQuery] string? sig)
    {
        if (string.IsNullOrEmpty(sig) || !_signer.IsValid(FindPhotoSuggestionsCommandHandler.SignaturePrefix + id, exp, sig))
            return Problem(statusCode: StatusCodes.Status403Forbidden, title: "Link expired", detail: "This preview link is no longer valid.");
        var suggestion = _store.Get(id);
        if (suggestion is null) return NotFound();
        Response.Headers.CacheControl = "private, max-age=300";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(suggestion.Content, "image/jpeg");
    }
}
