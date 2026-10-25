namespace Saturdaze.Domain.Entities;

/// <summary>
/// Regional research done once for a region cell and weekend and shared by every family in the
/// cell (L2-207). The rows it found live in the shared catalog; this records that it happened.
/// </summary>
public class RegionResearch
{
    public Guid Id { get; set; }

    /// <summary>The cell centre, "lat,lng" rounded to 0.5°, e.g. "43.5,-79.5".</summary>
    public string CellKey { get; set; } = string.Empty;

    public DateOnly WeekendOf { get; set; }
    public Guid AgentRunId { get; set; }
    public DateTimeOffset CompletedUtc { get; set; }
    public int ItemsUpserted { get; set; }
}
