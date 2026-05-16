using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

public class Restaurant
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Style { get; set; } = string.Empty;
    public MealSlot Slot { get; set; }
    public bool WifeApproved { get; set; }
    public string Notes { get; set; } = string.Empty;
    public int DriveMinutes { get; set; }
}
