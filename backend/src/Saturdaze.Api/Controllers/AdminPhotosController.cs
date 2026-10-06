using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Admin.Photos;

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
}
