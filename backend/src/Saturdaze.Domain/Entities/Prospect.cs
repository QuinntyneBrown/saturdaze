namespace Saturdaze.Domain.Entities;

/// <summary>
/// A prospective family an administrator described, with a sample weekend
/// planned for it (L2-159). The family and weekend are ordinary rows that no
/// account owns until an invitee claims them (ADR-019).
/// </summary>
public class Prospect
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public Guid WeekendId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }

    /// <summary>The first invitee to accept; owns the family from then on (L2-161).</summary>
    public Guid? ClaimedByUserId { get; set; }
    public DateTimeOffset? ClaimedAtUtc { get; set; }
}
