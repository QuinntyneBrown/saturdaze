using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Domain.Entities;

public class Activity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool Indoor { get; set; }
    public int MinAge { get; set; }
    public int MaxAge { get; set; }
    public int DriveMinutes { get; set; }
    public List<string> WeatherTags { get; set; } = new();
    public string Description { get; set; } = string.Empty;
    public string MapUrl { get; set; } = string.Empty;
    public GeoLocation? Geo { get; set; }
    public int TypicalDurationMinutes { get; set; }

    /// <summary>Weekend opening hours, local time; both or neither (L2-198).</summary>
    public TimeOnly? OpensAt { get; set; }

    public TimeOnly? ClosesAt { get; set; }

    /// <summary>The months it is worth going, 1-12; a start after the end wraps the year (L2-198).</summary>
    public int? SeasonStartMonth { get; set; }

    public int? SeasonEndMonth { get; set; }

    /// <summary>0 free, 1 under $20 a person, 2 $20-50, 3 over $50; null unknown.</summary>
    public int? PriceTier { get; set; }

    /// <summary>Content themes from <see cref="ValueObjects.ContentThemes"/> (L2-194).</summary>
    public List<string> Themes { get; set; } = new();

    /// <summary>The https page the facts were verified against (L2-199).</summary>
    public string? SourceUrl { get; set; }
}
