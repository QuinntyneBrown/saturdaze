using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Planning;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Calendar;

/// <summary>The weekend's events from a family's connected calendars, as planner commitments (L2-176).</summary>
public interface ICalendarCommitmentSource
{
    /// <summary>Never throws for a calendar that fails; that calendar contributes nothing (L2-177).</summary>
    Task<IReadOnlyList<CalendarCommitment>> GetAsync(Guid familyId, DateOnly weekendOf, CancellationToken ct);
}

/// <summary>
/// Reads Saturday 00:00 to Monday 00:00 (local) from every connected account in
/// the family that plans around its calendar, within one 5-second budget, and
/// keeps timed events the person has not declined, marked free or cancelled and
/// that Saturdaze did not write, split by day (L2-176, L2-177).
/// </summary>
public sealed class GoogleCalendarCommitmentSource : ICalendarCommitmentSource
{
    /// <summary>The longest a read may hold up planning (L2-177).</summary>
    public static readonly TimeSpan Budget = TimeSpan.FromSeconds(5);
    private const int MaxTitleLength = 160;

    private readonly IAppDbContext _db;
    private readonly IGoogleCalendarClient _google;
    private readonly ICalendarTokenProtector _protector;
    private readonly CalendarOptions _options;
    private readonly ILogger<GoogleCalendarCommitmentSource> _logger;

    public GoogleCalendarCommitmentSource(
        IAppDbContext db,
        IGoogleCalendarClient google,
        ICalendarTokenProtector protector,
        IOptions<CalendarOptions> options,
        ILogger<GoogleCalendarCommitmentSource> logger)
    {
        _db = db;
        _google = google;
        _protector = protector;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<IReadOnlyList<CalendarCommitment>> GetAsync(Guid familyId, DateOnly weekendOf, CancellationToken ct)
    {
        var connections = await _db.CalendarConnections
            .Where(c => c.Status == CalendarConnectionStatus.Connected && c.ReadCommitments
                && _db.Users.Any(u => u.Id == c.UserId && u.FamilyId == familyId))
            .ToListAsync(ct);
        if (connections.Count == 0) return Array.Empty<CalendarCommitment>();

        var zone = TimeZoneInfo.FindSystemTimeZoneById(_options.TimeZone);
        var from = Local(zone, weekendOf.ToDateTime(TimeOnly.MinValue));
        var to = Local(zone, weekendOf.AddDays(2).ToDateTime(TimeOnly.MinValue));

        using var budget = CancellationTokenSource.CreateLinkedTokenSource(ct);
        budget.CancelAfter(Budget);
        var result = new List<CalendarCommitment>();
        var revoked = false;
        foreach (var connection in connections)
        {
            try
            {
                var refreshToken = _protector.Unprotect(connection.ProtectedRefreshToken)
                    ?? throw new GoogleCalendarGrantRevokedException();
                var events = await _google.ListEventsAsync(refreshToken, from, to, budget.Token);
                result.AddRange(events.Where(Counts).SelectMany(e => Split(e, zone, weekendOf)));
            }
            catch (GoogleCalendarGrantRevokedException)
            {
                connection.Status = CalendarConnectionStatus.NeedsReconnect;
                revoked = true;
                _logger.LogWarning("Calendar connection {ConnectionId} needs reconnecting", connection.Id);
            }
            catch (Exception ex) when (ex is GoogleCalendarUnavailableException
                || (ex is OperationCanceledException && !ct.IsCancellationRequested))
            {
                _logger.LogWarning("Calendar read for connection {ConnectionId} skipped: {Error}",
                    connection.Id, ex.GetType().Name);
            }
        }
        if (revoked) await _db.SaveChangesAsync(ct);
        return result;
    }

    private static bool Counts(GoogleCalendarEvent e) =>
        !e.AllDay && !e.Cancelled && !e.Declined && !e.Free && !e.WrittenBySaturdaze
        && e.Start is not null && e.End is not null && e.End > e.Start;

    /// <summary>One commitment per weekend day the event touches, in local time.</summary>
    private static IEnumerable<CalendarCommitment> Split(GoogleCalendarEvent e, TimeZoneInfo zone, DateOnly weekendOf)
    {
        var start = TimeZoneInfo.ConvertTime(e.Start!.Value, zone).DateTime;
        var end = TimeZoneInfo.ConvertTime(e.End!.Value, zone).DateTime;
        var title = string.IsNullOrWhiteSpace(e.Summary) ? "Busy" : e.Summary.Trim();
        if (title.Length > MaxTitleLength) title = title[..MaxTitleLength];

        foreach (var (day, date) in new[] { (DayOfWeekend.Saturday, weekendOf), (DayOfWeekend.Sunday, weekendOf.AddDays(1)) })
        {
            var dayStart = date.ToDateTime(TimeOnly.MinValue);
            var dayEnd = dayStart.AddDays(1);
            var from = start > dayStart ? start : dayStart;
            var to = end < dayEnd ? end : dayEnd;
            if (from >= to) continue;
            // An event running to midnight ends at the day's last minute.
            yield return new CalendarCommitment(day, TimeOnly.FromDateTime(from),
                to == dayEnd ? TimeOnly.MaxValue : TimeOnly.FromDateTime(to), title);
        }
    }

    private static DateTimeOffset Local(TimeZoneInfo zone, DateTime local) => new(local, zone.GetUtcOffset(local));
}
