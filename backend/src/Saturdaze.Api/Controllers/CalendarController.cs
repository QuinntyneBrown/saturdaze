using System.Text;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Calendar;

namespace Saturdaze.Api.Controllers;

/// <summary>Calendar sync (L1-039, ADR-020): the Calendar section on Family and the subscription link.</summary>
[ApiController]
[Route("api/calendar")]
public sealed class CalendarController : ControllerBase
{
    private readonly ISender _sender;

    public CalendarController(ISender sender) => _sender = sender;

    [HttpGet]
    public async Task<ActionResult<CalendarSettingsDto>> Get(CancellationToken ct)
        => Ok(await _sender.Send(new GetCalendarSettingsQuery(), ct));

    /// <summary>Google's consent URL for connecting the caller's calendar (L2-165).</summary>
    [HttpPost("google/authorize")]
    public async Task<ActionResult<GoogleCalendarAuthorizationDto>> AuthorizeGoogle(CancellationToken ct)
        => Ok(await _sender.Send(new AuthorizeGoogleCalendarCommand(), ct));

    /// <summary>The code and state Google returned to <c>/family/calendar/google</c> (L2-165).</summary>
    [HttpPost("google/connect")]
    public async Task<ActionResult<CalendarSettingsDto>> ConnectGoogle(
        [FromBody] ConnectGoogleCalendarCommand command, CancellationToken ct)
        => Ok(await _sender.Send(command, ct));

    [HttpPut("google")]
    public async Task<ActionResult<CalendarSettingsDto>> UpdateGoogle(
        [FromBody] UpdateGoogleCalendarCommand command, CancellationToken ct)
        => Ok(await _sender.Send(command, ct));

    /// <summary>Revokes and forgets the caller's grant; written events stay (L2-167).</summary>
    [HttpDelete("google")]
    public async Task<IActionResult> DisconnectGoogle(CancellationToken ct)
    {
        await _sender.Send(new DisconnectGoogleCalendarCommand(), ct);
        return NoContent();
    }

    /// <summary>Mints the family's subscription link; the URL is returned only here (L2-171).</summary>
    [HttpPost("feed")]
    public async Task<ActionResult<CalendarFeedLinkDto>> CreateFeed(CancellationToken ct)
    {
        var feed = await _sender.Send(new CreateCalendarFeedCommand(), ct);
        var path = $"{Request.Host}/api/calendar/feed/{feed.Token}.ics";
        var link = new CalendarFeedLinkDto($"{Request.Scheme}://{path}", $"webcal://{path}", feed.CreatedUtc);
        return StatusCode(StatusCodes.Status201Created, link);
    }

    [HttpDelete("feed")]
    public async Task<IActionResult> StopFeed(CancellationToken ct)
    {
        await _sender.Send(new StopCalendarFeedCommand(), ct);
        return NoContent();
    }

    /// <summary>
    /// The subscription link. Anonymous by necessity: calendar applications fetch it
    /// as a bare URL and cannot attach a bearer (L2-008, L2-171).
    /// </summary>
    [HttpGet("feed/{token}.ics")]
    [AllowAnonymous]
    public async Task<IActionResult> Feed(string token, CancellationToken ct)
    {
        var weekend = await _sender.Send(new GetCalendarFeedQuery(token), ct);
        var ics = IcsWriter.ToIcs(weekend.WeekendOf,
            weekend.Events.Select(b => new IcsEvent(b.Id, b.Day, b.StartTime, b.EndTime, b.Title)));
        Response.Headers.CacheControl = "no-store";
        return File(Encoding.UTF8.GetBytes(ics), "text/calendar; charset=utf-8");
    }
}

/// <summary>The link the subscription dialog shows once: https and webcal forms of the same URL.</summary>
public sealed record CalendarFeedLinkDto(string Url, string WebcalUrl, DateTimeOffset CreatedUtc);
