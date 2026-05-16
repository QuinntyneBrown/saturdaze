namespace Saturdaze.Domain.Entities;

public class Weekend
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public DateOnly WeekendOf { get; set; }
    public bool IsFavourite { get; set; }
    public string Notes { get; set; } = string.Empty;
    public int RegenerateCount { get; set; }

    /// <summary>
    /// Optional user-supplied title for this weekend — e.g. "Bronte Creek +
    /// Rec Room". Surfaces in the Saved history view. Falls back to the
    /// top-activity highlight when null.
    /// </summary>
    public string? Title { get; set; }

    /// <summary>
    /// Optional 1–5 star rating the user awarded after the fact. Drives the
    /// "recent" vs "avoid" split on the Saved page.
    /// </summary>
    public int? Rating { get; set; }

    public List<ItineraryBlock> Blocks { get; set; } = new();
    public List<ShoppingErrand> Errands { get; set; } = new();
}
