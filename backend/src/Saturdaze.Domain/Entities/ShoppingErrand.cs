namespace Saturdaze.Domain.Entities;

public class ShoppingErrand
{
    public Guid Id { get; set; }
    public Guid WeekendId { get; set; }
    public string Description { get; set; } = string.Empty;
    public int EstimatedMinutes { get; set; }
    public bool Done { get; set; }
}
