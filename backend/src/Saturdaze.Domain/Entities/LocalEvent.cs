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
}
