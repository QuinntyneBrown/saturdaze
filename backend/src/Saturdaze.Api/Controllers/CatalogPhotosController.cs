using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Photos;

namespace Saturdaze.Api.Controllers;

/// <summary>
/// Curated place photos (ADR-015). Anonymous on purpose: they appear on every family's idea cards
/// and covers, and the API origin is on the image allow-list. Keys are random and never reused,
/// so the response is cacheable as immutable.
/// </summary>
[ApiController]
[Route("api/catalog-photos")]
public sealed class CatalogPhotosController : ControllerBase
{
    private readonly ICuratedPhotoStore _store;

    public CatalogPhotosController(ICuratedPhotoStore store) => _store = store;

    [HttpGet("{key}")]
    [AllowAnonymous]
    public async Task<IActionResult> Get(string key, CancellationToken ct)
    {
        var photo = await _store.OpenAsync(key, ct);
        if (photo is null) return NotFound();
        Response.Headers.CacheControl = "public, max-age=31536000, immutable";
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        return File(photo.Content, photo.ContentType);
    }
}
