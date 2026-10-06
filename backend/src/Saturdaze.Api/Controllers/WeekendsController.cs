using System.Text;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Covers;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Ideas;
using Saturdaze.Application.Photos;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Enums;

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

    /// <summary>Use the default cover, or one of the weekend's stops' photos (L2-096).</summary>
    [HttpPut("{id:guid}/cover")]
    public async Task<ActionResult<WeekendDto>> SetCover(Guid id, [FromBody] CoverRequest body, CancellationToken ct)
    {
        var source = body.Source?.ToLowerInvariant() switch
        {
            "stop" => CoverSource.Stop,
            "default" => CoverSource.Default,
            _ => throw new ValidationException("source", "Source must be default or stop."),
        };
        return Ok(await _sender.Send(new SetWeekendCoverCommand(id, source, body.PlaceId), ct));
    }

    /// <summary>
    /// The family's own photo as the cover (L2-097): multipart <c>file</c>, JPEG/PNG/WebP up to
    /// 10 MB. Oversize uploads are refused with 413 before anything is read or stored.
    /// </summary>
    [HttpPost("{id:guid}/cover")]
    [RequestSizeLimit(UploadRequestLimit)]
    public async Task<ActionResult<WeekendDto>> UploadCover(
        Guid id, CancellationToken ct)
    {
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
        return Ok(await _sender.Send(new UploadWeekendCoverCommand(id, buffer.ToArray()), ct));
    }

    private const long UploadRequestLimit = 12 * 1024 * 1024;
    private const long MultipartOverhead = 64 * 1024;

    private ObjectResult TooLarge() => Problem(
        statusCode: StatusCodes.Status413PayloadTooLarge,
        title: "Photo too large",
        detail: "Photos must be 10 MB or smaller.");

    /// <summary>Where an idea would land on a day, without changing the plan (L2-095).</summary>
    [HttpPost("{id:guid}/ideas/preview")]
    public async Task<ActionResult<IdeaPlacementDto>> PreviewIdea(Guid id, [FromBody] IdeaRequest body, CancellationToken ct)
    {
        var (kind, day, timing) = WeekendControllerHelpers.ParseIdea(body);
        return Ok(await _sender.Send(new PreviewIdeaPlacementQuery(id, kind, body.IdeaId, day, timing), ct));
    }

    /// <summary>Adds an idea to a day of the family's weekend (L2-095); 409 when it does not fit.</summary>
    [HttpPost("{id:guid}/ideas")]
    public async Task<ActionResult<WeekendDto>> AddIdea(Guid id, [FromBody] IdeaRequest body, CancellationToken ct)
    {
        var (kind, day, timing) = WeekendControllerHelpers.ParseIdea(body);
        return Ok(await _sender.Send(new AddIdeaToWeekendCommand(id, kind, body.IdeaId, day, timing), ct));
    }

    /// <summary>Only the owning family can mint a share link (scoped query).</summary>
    [HttpPost("{id:guid}/share")]
    public async Task<ActionResult<WeekendShareDto>> Share(Guid id, CancellationToken ct)
    {
        _ = await _sender.Send(new GetWeekendByIdQuery(id), ct);
        var token = WeekendControllerHelpers.EncodeToken(id);
        // The link is the API's preview page so link previews show the cover (L2-098 AC3).
        return Ok(new WeekendShareDto($"{ApiOrigin}/s/{token}", token));
    }

    /// <summary>
    /// The share link (L2-098 AC3). Link-preview crawlers do not run the app, so this page
    /// carries the Open Graph tags (the cover signed for a week) and sends browsers on to
    /// <c>{Saturdaze:Share:AppOrigin}/sample-weekend?share={token}</c>.
    /// </summary>
    [HttpGet("/s/{token}")]
    [AllowAnonymous]
    public async Task<ContentResult> SharePreview(
        string token, [FromServices] IConfiguration config, CancellationToken ct)
    {
        var weekend = await _sender.Send(new GetSharedWeekendQuery(WeekendControllerHelpers.DecodeToken(token)), ct);
        var appOrigin = (config["Saturdaze:Share:AppOrigin"] ?? ApiOrigin).TrimEnd('/');
        var target = $"{appOrigin}/sample-weekend?share={Uri.EscapeDataString(token)}";
        var image = weekend.Cover?.Url is { } url && url.StartsWith('/') ? $"{ApiOrigin}{url}" : weekend.Cover?.Url;
        Response.Headers.CacheControl = "no-store";
        return Content(WeekendControllerHelpers.SharePreviewHtml(weekend, image, target), "text/html; charset=utf-8");
    }

    private string ApiOrigin => $"{Request.Scheme}://{Request.Host}";

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
    public static (IdeaKind Kind, DayOfWeekend Day, IdeaTiming Timing) ParseIdea(IdeaRequest body)
    {
        if (!Enum.TryParse<IdeaKind>(body.IdeaKind, ignoreCase: true, out var kind) || !Enum.IsDefined(kind))
            throw new ValidationException("ideaKind", "Idea kind must be activity or event.");
        if (!Enum.TryParse<IdeaTiming>(body.Timing ?? nameof(IdeaTiming.BestFit), ignoreCase: true, out var timing)
            || !Enum.IsDefined(timing))
            throw new ValidationException("timing", "Timing must be bestFit, morning or afternoon.");
        return (kind, ParseDay(body.Day), timing);
    }

    public static DayOfWeekend ParseDay(string value)
        => Enum.TryParse<DayOfWeekend>(value, ignoreCase: true, out var day)
            ? day
            : throw new ValidationException("day", "Day must be Saturday or Sunday.");

    public static string SharePreviewHtml(WeekendDto weekend, string? image, string target)
    {
        static string E(string value) => System.Net.WebUtility.HtmlEncode(value);
        var sunday = weekend.WeekendOf.AddDays(1);
        var dates = $"{weekend.WeekendOf:ddd d MMM} – {sunday:ddd d MMM}";
        var title = string.IsNullOrWhiteSpace(weekend.Title) ? $"Our weekend · {dates}" : weekend.Title!;
        var highlights = weekend.Blocks
            .Where(b => b.Kind == BlockKind.Activity)
            .OrderBy(b => b.Day).ThenBy(b => b.StartTime)
            .Select(b => b.Title)
            .Distinct()
            .Take(3)
            .ToList();
        var description = highlights.Count > 0 ? $"{dates}: {string.Join(", ", highlights)}" : dates;

        var sb = new StringBuilder();
        sb.AppendLine("<!doctype html>");
        sb.AppendLine("<html lang=\"en\"><head><meta charset=\"utf-8\">");
        sb.AppendLine($"<title>{E(title)}</title>");
        sb.AppendLine($"<meta property=\"og:title\" content=\"{E(title)}\">");
        sb.AppendLine($"<meta property=\"og:description\" content=\"{E(description)}\">");
        sb.AppendLine("<meta property=\"og:type\" content=\"website\">");
        sb.AppendLine($"<meta property=\"og:url\" content=\"{E(target)}\">");
        if (image is not null)
        {
            sb.AppendLine($"<meta property=\"og:image\" content=\"{E(image)}\">");
            if (weekend.Cover is { Width: > 0, Height: > 0 } c)
            {
                sb.AppendLine($"<meta property=\"og:image:width\" content=\"{c.Width}\">");
                sb.AppendLine($"<meta property=\"og:image:height\" content=\"{c.Height}\">");
            }
            sb.AppendLine($"<meta property=\"og:image:alt\" content=\"{E(weekend.Cover!.Alt)}\">");
        }
        sb.AppendLine($"<meta name=\"twitter:card\" content=\"{(image is null ? "summary" : "summary_large_image")}\">");
        sb.AppendLine($"<meta http-equiv=\"refresh\" content=\"0; url={E(target)}\">");
        sb.AppendLine("</head><body>");
        sb.AppendLine($"<p><a href=\"{E(target)}\">Open {E(title)}</a></p>");
        sb.AppendLine("</body></html>");
        return sb.ToString();
    }

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

/// <summary>Body of the ideas endpoints: <c>{ ideaKind, ideaId, day, timing }</c>.</summary>
public sealed record IdeaRequest(string IdeaKind, Guid IdeaId, string Day, string? Timing);

/// <summary>Body of <c>PUT /api/weekends/{id}/cover</c>: <c>{ source: "default" | "stop", placeId }</c>.</summary>
public sealed record CoverRequest(string? Source, Guid? PlaceId);
