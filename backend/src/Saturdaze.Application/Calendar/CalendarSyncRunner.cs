using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Calendar;

/// <summary>Syncs every connection whose write is pending and due (ADR-020, decision 4).</summary>
public sealed class CalendarSyncRunner
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;
    private readonly ISender _sender;
    private readonly ILogger<CalendarSyncRunner> _logger;

    public CalendarSyncRunner(IAppDbContext db, IDateTimeProvider clock, ISender sender, ILogger<CalendarSyncRunner> logger)
    {
        _db = db;
        _clock = clock;
        _sender = sender;
        _logger = logger;
    }

    public async Task RunDueAsync(CancellationToken ct)
    {
        var now = _clock.UtcNow;
        var due = await _db.CalendarConnections.AsNoTracking()
            .Where(c => c.Status == CalendarConnectionStatus.Connected
                && c.SyncRequestedUtc != null
                && (c.NextAttemptUtc == null || c.NextAttemptUtc <= now))
            .Select(c => c.Id)
            .ToListAsync(ct);

        foreach (var id in due)
        {
            try
            {
                await _sender.Send(new SyncCalendarConnectionCommand(id), ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError("Calendar sync for connection {ConnectionId} failed: {Error}", id, ex.GetType().Name);
            }
        }
    }
}
