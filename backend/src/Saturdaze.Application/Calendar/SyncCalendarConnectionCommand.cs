using System.Security.Cryptography;
using System.Text;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Calendar;

/// <summary>Brings one connected calendar in line with the family's current weekend (L2-176).</summary>
public sealed record SyncCalendarConnectionCommand(Guid ConnectionId) : IRequest;

public sealed class SyncCalendarConnectionCommandHandler : IRequestHandler<SyncCalendarConnectionCommand>
{
    /// <summary>The longest wait between retries (L2-176: 1, 2, 4 … up to 60 minutes).</summary>
    public static readonly TimeSpan MaxBackoff = TimeSpan.FromMinutes(60);

    private readonly IAppDbContext _db;
    private readonly IGoogleCalendarClient _google;
    private readonly ICalendarTokenProtector _protector;
    private readonly IDateTimeProvider _clock;
    private readonly CalendarOptions _options;
    private readonly ILogger<SyncCalendarConnectionCommandHandler> _logger;

    public SyncCalendarConnectionCommandHandler(
        IAppDbContext db,
        IGoogleCalendarClient google,
        ICalendarTokenProtector protector,
        IDateTimeProvider clock,
        IOptions<CalendarOptions> options,
        ILogger<SyncCalendarConnectionCommandHandler> logger)
    {
        _db = db;
        _google = google;
        _protector = protector;
        _clock = clock;
        _options = options.Value;
        _logger = logger;
    }

    public async Task Handle(SyncCalendarConnectionCommand request, CancellationToken ct)
    {
        var connection = await _db.CalendarConnections.FirstOrDefaultAsync(c => c.Id == request.ConnectionId, ct);
        if (connection is null || connection.Status != CalendarConnectionStatus.Connected) return;
        var requestCount = connection.SyncRequestCount;

        try
        {
            var refreshToken = _protector.Unprotect(connection.ProtectedRefreshToken)
                ?? throw new GoogleCalendarGrantRevokedException();
            await ReconcileAsync(connection, refreshToken, ct);
            // Only the count this pass started from is marked written; a change that
            // arrived meanwhile raised SyncRequestCount and stays pending.
            connection.SyncedRequestCount = requestCount;
            connection.LastSyncedUtc = _clock.UtcNow;
            connection.FailedAttempts = 0;
            connection.NextAttemptUtc = null;
        }
        catch (GoogleCalendarGrantRevokedException)
        {
            _logger.LogWarning("Calendar connection {ConnectionId} needs reconnecting", connection.Id);
            connection.Status = CalendarConnectionStatus.NeedsReconnect;
            connection.SyncedRequestCount = requestCount;
            connection.NextAttemptUtc = null;
        }
        catch (GoogleCalendarUnavailableException ex)
        {
            connection.FailedAttempts++;
            var wait = TimeSpan.FromMinutes(Math.Min(MaxBackoff.TotalMinutes, Math.Pow(2, connection.FailedAttempts - 1)));
            connection.NextAttemptUtc = _clock.UtcNow + wait;
            _logger.LogWarning("Calendar write for connection {ConnectionId} failed ({Error}); retrying in {Minutes} min",
                connection.Id, ex.GetType().Name, wait.TotalMinutes);
        }
        await _db.SaveChangesAsync(ct);
    }

    private async Task ReconcileAsync(CalendarConnection connection, string refreshToken, CancellationToken ct)
    {
        var familyId = await _db.Users.Where(u => u.Id == connection.UserId).Select(u => u.FamilyId).FirstOrDefaultAsync(ct);
        var weekendOf = GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday(_clock.Today);
        var weekend = familyId is null ? null : await _db.Weekends.AsNoTracking()
            .Include(w => w.Blocks)
            .FirstOrDefaultAsync(w => w.FamilyId == familyId && w.WeekendOf == weekendOf, ct);
        if (weekend is null) return;

        var desired = weekend.Blocks
            .Where(CalendarEventSelection.Includes)
            .OrderBy(b => b.Day).ThenBy(b => b.StartTime)
            .Select(b => Write(connection.Id, weekend, b))
            .ToList();
        var links = await _db.CalendarEventLinks
            .Where(l => l.ConnectionId == connection.Id && l.WeekendId == weekend.Id)
            .ToListAsync(ct);

        foreach (var write in desired)
        {
            var fingerprint = Fingerprint(write);
            var link = links.FirstOrDefault(l => l.BlockId == write.BlockId);
            if (link is null)
            {
                var eventId = await _google.InsertEventAsync(refreshToken, write, ct);
                _db.CalendarEventLinks.Add(new CalendarEventLink
                {
                    Id = Guid.NewGuid(),
                    ConnectionId = connection.Id,
                    WeekendId = weekend.Id,
                    BlockId = write.BlockId,
                    EventId = eventId,
                    Fingerprint = fingerprint,
                });
            }
            else if (link.Fingerprint != fingerprint)
            {
                if (!await _google.UpdateEventAsync(refreshToken, link.EventId, write, ct))
                    link.EventId = await _google.InsertEventAsync(refreshToken, write, ct);
                link.Fingerprint = fingerprint;
            }
            await _db.SaveChangesAsync(ct);
        }

        var wanted = desired.Select(d => d.BlockId).ToHashSet();
        foreach (var gone in links.Where(l => !wanted.Contains(l.BlockId)))
        {
            await _google.DeleteEventAsync(refreshToken, gone.EventId, ct);
            _db.CalendarEventLinks.Remove(gone);
            await _db.SaveChangesAsync(ct);
        }
    }

    /// <summary>
    /// A Google event id (base32hex, lowercase hex is a subset) that is the same for
    /// one connection and block every time it is computed.
    /// </summary>
    public static string EventIdFor(Guid connectionId, Guid blockId)
        => "sd" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{connectionId:N}:{blockId:N}")))
            .ToLowerInvariant()[..40];

    private GoogleCalendarEventWrite Write(Guid connectionId, Weekend weekend, ItineraryBlock block)
    {
        var date = block.Day == DayOfWeekend.Saturday ? weekend.WeekendOf : weekend.WeekendOf.AddDays(1);
        var title = string.IsNullOrWhiteSpace(weekend.Title) ? "This weekend" : weekend.Title.Trim();
        return new GoogleCalendarEventWrite(
            EventIdFor(connectionId, block.Id),
            block.Id,
            block.Title,
            $"Part of {title}. Planned with Saturdaze.",
            string.IsNullOrWhiteSpace(block.Stop?.Address) ? null : block.Stop!.Address,
            date.ToDateTime(block.StartTime),
            date.ToDateTime(block.EndTime),
            _options.TimeZone);
    }

    public static string Fingerprint(GoogleCalendarEventWrite write)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(string.Join('\u001f',
            write.Summary, write.Description, write.Location ?? string.Empty,
            write.Start.ToString("O"), write.End.ToString("O"), write.TimeZone))));
}
