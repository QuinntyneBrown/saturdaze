using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Enums;
using System.Text;

namespace Saturdaze.Api.Controllers;

[ApiController]
[Route("api/weekends")]
public sealed class WeekendsController : ControllerBase
{
    private readonly ISender _sender;

    public WeekendsController(ISender sender) => _sender = sender;

    [HttpPost("plan")]
    public async Task<ActionResult<WeekendDto>> Plan([FromBody] GenerateWeekendCommand command, CancellationToken ct)
        => Ok(await _sender.Send(command, ct));

    [HttpGet("current")]
    public async Task<ActionResult<WeekendDto>> Current(CancellationToken ct)
        => Ok(await _sender.Send(new GetCurrentWeekendQuery(), ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WeekendDto>> GetById(Guid id, CancellationToken ct)
        => Ok(await _sender.Send(new GetWeekendByIdQuery(id), ct));

    [HttpPost("{id:guid}/regenerate")]
    public async Task<ActionResult<WeekendDto>> Regenerate(Guid id, CancellationToken ct)
        => Ok(await _sender.Send(new RegenerateWeekendCommand(id), ct));

    [HttpPost("{id:guid}/days/{day}/regenerate")]
    public async Task<ActionResult<WeekendDto>> RegenerateDay(Guid id, string day, CancellationToken ct)
        => Ok(await _sender.Send(new RegenerateWeekendDayCommand(id, WeekendControllerHelpers.ParseDay(day)), ct));

    [HttpPut("{id:guid}/days/{day}/lock")]
    public async Task<ActionResult<WeekendDto>> LockDay(
        Guid id,
        string day,
        [FromBody] LockDayRequest body,
        CancellationToken ct)
        => Ok(await _sender.Send(new LockWeekendDayCommand(id, WeekendControllerHelpers.ParseDay(day), body.Locked), ct));

    [HttpPost("{id:guid}/remix")]
    public async Task<ActionResult<WeekendDto>> Remix(Guid id, CancellationToken ct)
        => Ok(await _sender.Send(new ReuseWeekendCommand(id, Remix: true), ct));

    [HttpPost("{id:guid}/repeat")]
    public async Task<ActionResult<WeekendDto>> Repeat(Guid id, CancellationToken ct)
        => Ok(await _sender.Send(new ReuseWeekendCommand(id, Remix: false), ct));

    /// <summary>Only the owning family can mint a share link (scoped query).</summary>
    [HttpPost("{id:guid}/share")]
    public async Task<ActionResult<WeekendShareDto>> Share(Guid id, CancellationToken ct)
    {
        _ = await _sender.Send(new GetWeekendByIdQuery(id), ct);
        var token = WeekendControllerHelpers.EncodeToken(id);
        var origin = Request.Headers.Origin.FirstOrDefault();
        if (string.IsNullOrWhiteSpace(origin))
            origin = $"{Request.Scheme}://{Request.Host}";

        return Ok(new WeekendShareDto($"{origin}/sample-weekend?share={token}", token));
    }

    /// <summary>Public read-only view behind a share link.</summary>
    [HttpGet("shared/{token}")]
    [AllowAnonymous]
    public async Task<ActionResult<WeekendDto>> Shared(string token, CancellationToken ct)
        => Ok(await _sender.Send(new GetSharedWeekendQuery(WeekendControllerHelpers.DecodeToken(token)), ct));

    /// <summary>
    /// Calendar subscription feed. Anonymous by necessity: the browser, webcal:
    /// and Google Calendar fetch this as a bare URL and cannot attach a bearer.
    /// </summary>
    [HttpGet("{id:guid}/calendar.ics")]
    [AllowAnonymous]
    public async Task<IActionResult> Calendar(Guid id, CancellationToken ct)
    {
        var weekend = await _sender.Send(new GetSharedWeekendQuery(id), ct);
        var bytes = Encoding.UTF8.GetBytes(WeekendControllerHelpers.ToIcs(weekend));
        return File(bytes, "text/calendar; charset=utf-8", $"saturdaze-{weekend.WeekendOf:yyyy-MM-dd}.ics");
    }

    [HttpGet("history")]
    public async Task<ActionResult<IReadOnlyList<WeekendSummaryDto>>> History(
        [FromQuery] int take = 20, CancellationToken ct = default)
        => Ok(await _sender.Send(new GetWeekendHistoryQuery(take), ct));

    [HttpPut("{id:guid}/favourite")]
    public async Task<ActionResult<WeekendDto>> Favourite(
        Guid id, [FromBody] FavouriteRequest body, CancellationToken ct)
        => Ok(await _sender.Send(new MarkFavouriteCommand(id, body.Favourite), ct));

    /// <summary>1–5 stars, or null to clear (L2-026).</summary>
    [HttpPut("{id:guid}/rating")]
    public async Task<ActionResult<WeekendDto>> Rate(
        Guid id, [FromBody] RatingRequest body, CancellationToken ct)
        => Ok(await _sender.Send(new RateWeekendCommand(id, body.Rating), ct));

    /// <summary>User-supplied title shown on the saved-weekends page (L1-010).</summary>
    [HttpPut("{id:guid}/title")]
    public async Task<ActionResult<WeekendDto>> Rename(
        Guid id, [FromBody] TitleRequest body, CancellationToken ct)
        => Ok(await _sender.Send(new RenameWeekendCommand(id, body.Title), ct));
}

public sealed record FavouriteRequest(bool Favourite);
public sealed record LockDayRequest(bool Locked);
public sealed record RatingRequest(int? Rating);
public sealed record TitleRequest(string? Title);

file static class WeekendControllerHelpers
{
    public static DayOfWeekend ParseDay(string value)
        => Enum.TryParse<DayOfWeekend>(value, ignoreCase: true, out var day)
            ? day
            : throw new ValidationException("day", "Day must be Saturday or Sunday.");

    public static string EncodeToken(Guid id)
        => Convert.ToBase64String(id.ToByteArray()).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    public static Guid DecodeToken(string token)
    {
        try
        {
            var padded = token.Replace('-', '+').Replace('_', '/');
            padded = padded.PadRight(padded.Length + (4 - padded.Length % 4) % 4, '=');
            return new Guid(Convert.FromBase64String(padded));
        }
        catch (Exception ex) when (ex is FormatException or ArgumentException)
        {
            throw new NotFoundException("Share link is not valid.");
        }
    }

    public static string ToIcs(WeekendDto weekend)
    {
        var sb = new StringBuilder();
        sb.AppendLine("BEGIN:VCALENDAR");
        sb.AppendLine("VERSION:2.0");
        sb.AppendLine("PRODID:-//Saturdaze//Weekend Plan//EN");
        sb.AppendLine("CALSCALE:GREGORIAN");

        foreach (var block in weekend.Blocks.OrderBy(b => b.Day).ThenBy(b => b.StartTime))
        {
            var date = block.Day == DayOfWeekend.Saturday ? weekend.WeekendOf : weekend.WeekendOf.AddDays(1);
            sb.AppendLine("BEGIN:VEVENT");
            sb.AppendLine($"UID:{block.Id}@saturdaze");
            sb.AppendLine($"DTSTAMP:{DateTimeOffset.UtcNow:yyyyMMddTHHmmssZ}");
            sb.AppendLine($"DTSTART:{FormatIcsDateTime(date, block.StartTime)}");
            sb.AppendLine($"DTEND:{FormatIcsDateTime(date, block.EndTime)}");
            sb.AppendLine($"SUMMARY:{EscapeIcs(block.Title)}");
            if (!string.IsNullOrWhiteSpace(block.Reason))
                sb.AppendLine($"DESCRIPTION:{EscapeIcs(block.Reason)}");
            sb.AppendLine("END:VEVENT");
        }

        sb.AppendLine("END:VCALENDAR");
        return sb.ToString();
    }

    private static string FormatIcsDateTime(DateOnly date, TimeOnly time)
        => $"{date:yyyyMMdd}T{time:HHmmss}";

    private static string EscapeIcs(string value)
        => value.Replace("\\", "\\\\")
            .Replace(";", "\\;")
            .Replace(",", "\\,")
            .Replace("\r\n", "\\n")
            .Replace("\n", "\\n");
}
