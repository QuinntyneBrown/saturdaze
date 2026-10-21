using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Calendar;

/// <summary>Wakes <c>CalendarSyncService</c>; the work itself is the pending flag in the database.</summary>
public interface ICalendarSyncSignal
{
    void Notify();
}

/// <summary>
/// Marks every connected calendar in a family as pending and wakes the sync
/// service (ADR-020, decision 4). A family without connections costs one query.
/// </summary>
public sealed class CalendarSyncScheduler
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;
    private readonly ICalendarSyncSignal _signal;

    public CalendarSyncScheduler(IAppDbContext db, IDateTimeProvider clock, ICalendarSyncSignal signal)
    {
        _db = db;
        _clock = clock;
        _signal = signal;
    }

    public async Task RequestAsync(Guid familyId, CancellationToken ct)
    {
        var connections = await _db.CalendarConnections
            .Where(c => c.Status == CalendarConnectionStatus.Connected
                && _db.Users.Any(u => u.Id == c.UserId && u.FamilyId == familyId))
            .ToListAsync(ct);
        if (connections.Count == 0) return;

        var now = _clock.UtcNow;
        foreach (var connection in connections)
        {
            connection.SyncRequestedUtc = now;
            // A change made while a write is backing off goes out with the retry, not before it.
            if (connection.FailedAttempts == 0) connection.NextAttemptUtc = now;
        }
        await _db.SaveChangesAsync(ct);
        _signal.Notify();
    }
}
