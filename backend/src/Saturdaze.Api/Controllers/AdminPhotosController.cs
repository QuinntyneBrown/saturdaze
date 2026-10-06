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

    private static PlaceKind ParseKind(string kind)
        => Enum.TryParse<PlaceKind>(kind, true, out var parsed)
            ? parsed
            : throw new ValidationException("kind", "Kind must be Activity, Restaurant or LocalEvent.");
}
