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
    public int TypicalDurationMinutes { get; set; }
}
