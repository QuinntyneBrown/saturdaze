using Saturdaze.Domain.Enums;
using Saturdaze.Domain.ValueObjects;

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

    /// <summary>
    /// A commitment that came from an event in a connected calendar (L2-177):
    /// never written back to a calendar, titled "Busy" on a share link.
    /// </summary>
    public bool FromCalendar { get; set; }

    /// <summary>
    /// Where the block happens when that is a catalog place (L2-103), copied when the block
    /// is planned so the record survives catalog edits. Null at home or when unknown.
    /// </summary>
    public GeoLocation? Stop { get; set; }
}
