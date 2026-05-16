namespace Saturdaze.Domain.Entities;

public class Weekend
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public DateOnly WeekendOf { get; set; }
    public bool IsFavourite { get; set; }
    public string Notes { get; set; } = string.Empty;
    public int RegenerateCount { get; set; }

    public List<ItineraryBlock> Blocks { get; set; } = new();
    public List<ShoppingErrand> Errands { get; set; } = new();
}
