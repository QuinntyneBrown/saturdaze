namespace Saturdaze.Domain.Entities;

/// <summary>
/// A family's private subscription link (L2-171). Only the hash of its random
/// token is stored; creating a new link replaces this one.
/// </summary>
public class CalendarFeed
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset CreatedUtc { get; set; }
}
