using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Domain.Entities;

public class Family
{
    public Guid Id { get; set; }

    /// <summary>Display name, e.g. "The Browns". Optional; captured at signup.</summary>
    public string? Name { get; set; }

    /// <summary>
    /// The account that created the family; only it changes who's in (L2-124).
    /// Null for a family no account has created (seed data), which any of its
    /// accounts may manage (ADR-016).
    /// </summary>
    public Guid? OwnerUserId { get; set; }

    public string HomeLocation { get; set; } = string.Empty;

    /// <summary>Coordinates of home (L2-099); falls back to HomeLocationOptions when null.</summary>
    public GeoLocation? HomeCoordinates { get; set; }
    public bool BudgetEnabled { get; set; }

    /// <summary>"Try something new each weekend" — drives the planner's novelty bonus.</summary>
    public bool TryNewEnabled { get; set; }

    /// <summary>"Friday preview notifications" — captured at signup, honoured once delivery exists.</summary>
    public bool FridayPreviewEnabled { get; set; } = true;

    public List<FamilyMember> Members { get; set; } = new();
    public List<Commitment> Commitments { get; set; } = new();
    public List<Preference> Preferences { get; set; } = new();
}
