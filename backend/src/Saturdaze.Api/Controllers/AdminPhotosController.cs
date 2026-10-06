using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Admin.Photos;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Photos;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Api.Controllers;

/// <summary>
/// Saturdaze Admin's catalog photo endpoints (L1-036). Every action requires the Admin
/// policy on top of the authenticated fallback (L2-111 AC2, AC3); business rules live
/// in the <c>Admin/Photos</c> handlers.
/// </summary>
[ApiController]
[Route("api/admin")]
[Authorize(Policy = "Admin")]
public sealed class AdminPhotosController : ControllerBase
{
    private readonly ISender _sender;

    public AdminPhotosController(ISender sender) => _sender = sender;

    /// <summary>Photo coverage per catalog for the Photo health screen (L2-112).</summary>
    [HttpGet("photo-health")]
    public async Task<ActionResult<PhotoHealthDto>> PhotoHealth(CancellationToken ct)
        => Ok(await _sender.Send(new GetPhotoHealthQuery(), ct));

    /// <summary>The catalog places with their primary photo and health flags (L2-113).</summary>
    [HttpGet("places")]
    public async Task<ActionResult<AdminPlacePageDto>> Places(
        [FromQuery] string? q,
        [FromQuery] string? kind,
        [FromQuery] string? flag,
        [FromQuery] string? source,
        [FromQuery] bool upcoming,
        [FromQuery] string? sort,
        [FromQuery] int page,
        CancellationToken ct)
        => Ok(await _sender.Send(new ListAdminPlacesQuery(q, kind, flag, source, upcoming, sort, page < 1 ? 1 : page), ct));

    /// <summary>Every photo of one place, its review state and the cover impact (L2-114).</summary>
    [HttpGet("places/{kind}/{id:guid}/photos")]
    public async Task<ActionResult<PlacePhotosDto>> PlacePhotos(string kind, Guid id, CancellationToken ct)
        => Ok(await _sender.Send(new GetPlacePhotosQuery(ParseKind(kind), id), ct));

    /// <summary>
    /// A curated upload (L2-115): multipart <c>file</c> (JPEG, PNG or WebP up to 10 MB) with
    /// <c>alt</c>, <c>attribution</c> and <c>licence</c> fields. Oversize uploads are refused with
    /// 413 before anything is read or stored.
    /// </summary>
    [HttpPost("places/{kind}/{id:guid}/photos")]
    [RequestSizeLimit(UploadRequestLimit)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<AdminPhotoDto>> Upload(string kind, Guid id, CancellationToken ct)
    {
        var placeKind = ParseKind(kind);
        const long max = PhotoOptions.MaxUploadBytes;
        if (Request.ContentLength > max + MultipartOverhead) return TooLarge();
        if (!Request.HasFormContentType)
            throw new ValidationException("file", "Send the photo as multipart form data.");

        var form = await Request.ReadFormAsync(ct);
        var file = form.Files.GetFile("file")
            ?? throw new ValidationException("file", "Choose a photo to upload.");
        if (file.Length > max) return TooLarge();

        using var buffer = new MemoryStream((int)file.Length);
        await file.CopyToAsync(buffer, ct);
        var dto = await _sender.Send(new UploadCuratedPhotoCommand(
            placeKind, id, buffer.ToArray(), form["alt"], form["attribution"], form["licence"]), ct);
        return CreatedAtAction(nameof(PlacePhotos), new { kind = placeKind.ToString(), id }, dto);
    }

    public record AddPhotoUrlRequest(string? Url, string? Alt, string? Attribution, string? Licence);

    /// <summary>A curated photo by its allow-listed HTTPS address (L2-116): the same route as the upload, as JSON.</summary>
    [HttpPost("places/{kind}/{id:guid}/photos")]
    [Consumes("application/json")]
    public async Task<ActionResult<AdminPhotoDto>> AddFromUrl(string kind, Guid id, [FromBody] AddPhotoUrlRequest req, CancellationToken ct)
    {
        var placeKind = ParseKind(kind);
        var dto = await _sender.Send(new AddPhotoFromUrlCommand(placeKind, id, req.Url, req.Alt, req.Attribution, req.Licence), ct);
        return CreatedAtAction(nameof(PlacePhotos), new { kind = placeKind.ToString(), id }, dto);
    }

    private const long UploadRequestLimit = 12 * 1024 * 1024;
    private const long MultipartOverhead = 64 * 1024;

    private ObjectResult TooLarge() => Problem(
        statusCode: StatusCodes.Status413PayloadTooLarge,
        title: "Photo too large",
        detail: "Photos must be 10 MB or smaller.");

    public record EditPhotoRequest(string? Alt, string? Attribution, string? Licence);

    /// <summary>Edits alt text, attribution and licence; the URL never changes (L2-118).</summary>
    [HttpPatch("photos/{photoId:guid}")]
    public async Task<ActionResult<AdminPhotoDto>> Edit(Guid photoId, [FromBody] EditPhotoRequest req, CancellationToken ct)
        => Ok(await _sender.Send(new EditPhotoDetailsCommand(photoId, req.Alt, req.Attribution, req.Licence), ct));

    /// <summary>Makes the photo its place's only primary (L2-117).</summary>
    [HttpPost("photos/{photoId:guid}/primary")]
    public async Task<ActionResult<AdminPhotoDto>> MakePrimary(Guid photoId, CancellationToken ct)
        => Ok(await _sender.Send(new MakePhotoPrimaryCommand(photoId), ct));

    /// <summary>
    /// Removes the photo and, for a curated upload, its file (L2-119). Removing the primary needs
    /// <c>nextPrimaryId</c>: a sibling's id or <c>none</c>.
    /// </summary>
    [HttpDelete("photos/{photoId:guid}")]
    public async Task<IActionResult> Remove(Guid photoId, [FromQuery] string? nextPrimaryId, CancellationToken ct)
    {
        await _sender.Send(new RemovePhotoCommand(photoId, nextPrimaryId), ct);
        return NoContent();
    }

    /// <summary>Unreviewed provider photos, newest first, with the primary each would replace (L2-120).</summary>
    [HttpGet("photo-reviews")]
    public async Task<ActionResult<IReadOnlyList<PhotoReviewItemDto>>> PhotoReviews(CancellationToken ct)
        => Ok(await _sender.Send(new ListPhotoReviewsQuery(), ct));

    public record ReviewPhotoRequest(string? Decision, string? Reason);

    /// <summary>Keeps, promotes or rejects an unreviewed provider photo (L2-120).</summary>
    [HttpPost("photos/{photoId:guid}/review")]
    public async Task<IActionResult> Review(Guid photoId, [FromBody] ReviewPhotoRequest req, CancellationToken ct)
    {
        await _sender.Send(new ReviewPhotoCommand(photoId, req.Decision, req.Reason), ct);
        return NoContent();
    }

    private static PlaceKind ParseKind(string kind)
        => Enum.TryParse<PlaceKind>(kind, true, out var parsed)
            ? parsed
            : throw new ValidationException("kind", "Kind must be Activity, Restaurant or LocalEvent.");
}
