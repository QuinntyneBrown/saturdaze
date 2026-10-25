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

    /// <summary>Daily start and end, local time; both or neither (L2-198).</summary>
    public TimeOnly? StartTime { get; set; }

    public TimeOnly? EndTime { get; set; }

    /// <summary>0 free, 1 under $20 a person, 2 $20-50, 3 over $50; null unknown.</summary>
    public int? PriceTier { get; set; }

    /// <summary>The ages it is for; both or neither.</summary>
    public int? MinAge { get; set; }

    public int? MaxAge { get; set; }

    /// <summary>Content themes from <see cref="ContentThemes"/> (L2-194).</summary>
    public List<string> Themes { get; set; } = new();
}
