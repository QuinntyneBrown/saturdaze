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
