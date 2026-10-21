namespace Saturdaze.Domain.Enums;

/// <summary>Explicit values: these are persisted as integers.</summary>
public enum CalendarConnectionStatus
{
    Connected = 1,
    /// <summary>Google reported the grant expired or revoked (L2-178).</summary>
    NeedsReconnect = 2
}
