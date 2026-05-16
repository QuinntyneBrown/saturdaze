namespace Saturdaze.Domain.Entities;

public class Commitment
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
}
