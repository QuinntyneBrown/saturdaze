using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Domain.Entities;

public class Commitment
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    /// <summary>The members it is for; empty means everyone (L2-192).</summary>
    public List<Guid> AttendeeMemberIds { get; set; } = new();

    /// <summary>Where it happens; the plan drives there and back when known (L2-192, L2-193).</summary>
    public GeoLocation? Location { get; set; }
}
