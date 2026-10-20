using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

/// <summary>
/// One administrator change to a family's weekend (L2-161): who, when (UTC), the family,
/// the weekend, the action, the day or block it touched, and the values before and after
/// as JSON. The family's own actions are never recorded here.
/// </summary>
public class WeekendAuditEntry
{
    public Guid Id { get; set; }
    /// <summary>Database-assigned insert order, so entries written in the same instant still list newest first.</summary>
    public long Sequence { get; set; }
    public DateTimeOffset OccurredAt { get; set; }
    public Guid AdminUserId { get; set; }
    public string AdminEmail { get; set; } = string.Empty;
    public Guid FamilyId { get; set; }
    public Guid WeekendId { get; set; }
    public DateOnly WeekendOf { get; set; }
    public WeekendAuditAction Action { get; set; }
    public DayOfWeekend? Day { get; set; }
    public Guid? BlockId { get; set; }
    /// <summary>JSON of the values the action changed, before it; null for a plan.</summary>
    public string? Before { get; set; }
    /// <summary>JSON of the values after the action.</summary>
    public string? After { get; set; }
}
