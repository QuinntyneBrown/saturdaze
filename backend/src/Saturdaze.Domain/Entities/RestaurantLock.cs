using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

public class RestaurantLock
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public Guid RestaurantId { get; set; }
    public DayOfWeekend Day { get; set; }
    public MealSlot Slot { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
}
