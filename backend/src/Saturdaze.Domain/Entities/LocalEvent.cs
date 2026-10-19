using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Domain.Entities;

public class LocalEvent
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly StartsOn { get; set; }
    public DateOnly EndsOn { get; set; }
    public string Location { get; set; } = string.Empty;
    public int DriveMinutes { get; set; }
    public string Url { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;

    /// <summary>Indoor (true) or outdoor (false); null while unknown (L2-146).</summary>
    public bool? Indoor { get; set; }
    public GeoLocation? Geo { get; set; }
}
