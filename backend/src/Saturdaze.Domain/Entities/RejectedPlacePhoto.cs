using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

/// <summary>
/// A provider photo an administrator rejected (L2-120). The row outlives the photo so
/// ingestion never stores the same address for the place again (L2-121 AC1).
/// </summary>
public class RejectedPlacePhoto
{
    public Guid Id { get; set; }
    public PlaceKind PlaceKind { get; set; }
    public Guid PlaceId { get; set; }
    public string Url { get; set; } = string.Empty;
    public DateTimeOffset RejectedAt { get; set; }
    public Guid RejectedBy { get; set; }
    /// <summary>The administrator's optional note ("Wrong venue").</summary>
    public string? Reason { get; set; }
}
