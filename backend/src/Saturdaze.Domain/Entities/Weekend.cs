using Saturdaze.Domain.Enums;
using Saturdaze.Domain.ValueObjects;

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

    /// <summary>Home as it was when the weekend was planned; travel legs start and end there (L2-090).</summary>
    public GeoLocation? Home { get; set; }

    /// <summary>Where the cover comes from (L2-096); a new weekend uses the default rule.</summary>
    public CoverSource CoverSource { get; set; } = CoverSource.Default;

    /// <summary>The chosen stop's catalog and id when <see cref="CoverSource"/> is <c>Stop</c>.</summary>
    public PlaceKind? CoverPlaceKind { get; set; }

    public Guid? CoverPlaceId { get; set; }

    /// <summary>The uploaded photo's private storage key when <see cref="CoverSource"/> is <c>Upload</c> (L2-097).</summary>
    public string? CoverUploadKey { get; set; }

    public int? CoverUploadWidth { get; set; }

    public int? CoverUploadHeight { get; set; }
    public List<ShoppingErrand> Errands { get; set; } = new();
}
