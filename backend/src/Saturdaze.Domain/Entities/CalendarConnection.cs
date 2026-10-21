using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

/// <summary>
/// One account's grant to the primary calendar of a Google account (L2-173).
/// The refresh token is stored only encrypted (ADR-022); the family is the
/// account's own, so the connection follows the account.
/// </summary>
public class CalendarConnection
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string GoogleSubject { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string ProtectedRefreshToken { get; set; } = string.Empty;
    public bool ReadCommitments { get; set; } = true;
    public CalendarConnectionStatus Status { get; set; } = CalendarConnectionStatus.Connected;
    public DateTimeOffset CreatedUtc { get; set; }
    public DateTimeOffset? LastSyncedUtc { get; set; }

    /// <summary>When a write was last asked for (L2-176).</summary>
    public DateTimeOffset? SyncRequestedUtc { get; set; }

    /// <summary>
    /// Counts the writes asked of this calendar; only <c>CalendarSyncScheduler</c> and
    /// connecting raise it. The calendar is pending while it is ahead of
    /// <see cref="SyncedRequestCount"/>, which only the sync handler sets, so a change
    /// that arrives during a write is never lost to the write's own save.
    /// </summary>
    public int SyncRequestCount { get; set; }

    /// <summary>The <see cref="SyncRequestCount"/> the last finished write started from.</summary>
    public int SyncedRequestCount { get; set; }

    /// <summary>When the next write may be tried; pushed back after a failure.</summary>
    public DateTimeOffset? NextAttemptUtc { get; set; }

    /// <summary>Writes that failed in a row; sets the back-off.</summary>
    public int FailedAttempts { get; set; }
}
