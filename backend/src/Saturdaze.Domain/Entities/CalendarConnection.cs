using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

/// <summary>
/// One account's grant to the primary calendar of a Google account (L2-172).
/// The refresh token is stored only encrypted (ADR-020); the family is the
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

    /// <summary>When the plan last changed without being written yet; null when the calendar is up to date (L2-175).</summary>
    public DateTimeOffset? SyncRequestedUtc { get; set; }

    /// <summary>When the next write may be tried; pushed back after a failure.</summary>
    public DateTimeOffset? NextAttemptUtc { get; set; }

    /// <summary>Writes that failed in a row; sets the back-off.</summary>
    public int FailedAttempts { get; set; }
}
