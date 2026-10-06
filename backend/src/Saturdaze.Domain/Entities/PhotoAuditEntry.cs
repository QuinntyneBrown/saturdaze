using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

/// <summary>
/// One administrator change to a place photo (L2-122): who, when (UTC), the place, the
/// action and the values before and after as JSON. The place stays on the entry after the
/// photo row is deleted, so the log still reads.
/// </summary>
public class PhotoAuditEntry
{
    public Guid Id { get; set; }
    /// <summary>Database-assigned insert order, so entries written in the same instant still list newest first.</summary>
    public long Sequence { get; set; }
    public DateTimeOffset OccurredAt { get; set; }
    public Guid AdminUserId { get; set; }
    public string AdminEmail { get; set; } = string.Empty;
    public PlaceKind PlaceKind { get; set; }
    public Guid PlaceId { get; set; }
    public Guid PhotoId { get; set; }
    public PhotoAuditAction Action { get; set; }
    /// <summary>JSON of the values the action changed, before it; null for a create.</summary>
    public string? Before { get; set; }
    /// <summary>JSON of the values after the action; null for a removal.</summary>
    public string? After { get; set; }
}
