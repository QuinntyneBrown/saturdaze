using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

public class ItineraryBlock
{
    public Guid Id { get; set; }
    public Guid WeekendId { get; set; }
    public DayOfWeekend Day { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public BlockKind Kind { get; set; }
    public string Title { get; set; } = string.Empty;
    public Guid? RefId { get; set; }
    public bool IsLocked { get; set; }
    public string Reason { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
