using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

/// <summary>
/// A date for two adults of the family on one meal of one day of a weekend (L2-219, ADR-025). Its own
/// aggregate: the weekend sees it only as one locked <see cref="BlockKind.Date"/> block.
/// </summary>
public class CoupleDate
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public Guid WeekendId { get; set; }
    public DayOfWeekend Day { get; set; }
    public MealSlot Meal { get; set; }

    /// <summary>From the first drive to the last (L2-219).</summary>
    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    /// <summary>The two members going.</summary>
    public List<Guid> AttendeeMemberIds { get; set; } = new();

    public Guid RestaurantId { get; set; }
    public Guid? ActivityId { get; set; }

    /// <summary>The couple dropped the activity (L2-223); a regenerate keeps it dropped.</summary>
    public bool ActivityDropped { get; set; }

    /// <summary>Swapped away from this date; never offered again for it (L2-223 AC2).</summary>
    public List<Guid> RejectedRestaurantIds { get; set; } = new();

    public List<Guid> RejectedActivityIds { get; set; } = new();

    /// <summary>The planned steps (drives, meal, activity) with their reasons, as JSON.</summary>
    public string StepsJson { get; set; } = "[]";

    public int RegenerateCount { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
}
