namespace Saturdaze.Domain.Entities;

/// <summary>
/// The Google event written for one block through one connection (L2-168), so
/// later writes update or delete that same event. <see cref="Fingerprint"/> is a
/// hash of what was written; an unchanged block is not written again.
/// </summary>
public class CalendarEventLink
{
    public Guid Id { get; set; }
    public Guid ConnectionId { get; set; }
    public Guid WeekendId { get; set; }
    public Guid BlockId { get; set; }
    public string EventId { get; set; } = string.Empty;
    public string Fingerprint { get; set; } = string.Empty;
}
