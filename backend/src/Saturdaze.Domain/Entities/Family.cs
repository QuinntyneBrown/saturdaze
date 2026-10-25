using Saturdaze.Domain.Enums;
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

    /// <summary>How far the family drives, one way (L2-191).</summary>
    public int MaxDriveMinutes { get; set; } = 120;

    /// <summary>Content themes from <see cref="ContentThemes"/> the family leaves out (L2-194).</summary>
    public List<string> ExcludedThemes { get; set; } = new();

    /// <summary>Worship and rest: at most one outing on Sunday (L2-194, L2-195).</summary>
    public bool QuietSunday { get; set; }

    /// <summary>When the planner's day starts (L2-195).</summary>
    public TimeOnly DayStart { get; set; } = new(9, 0);

    /// <summary>The youngest's bedtime; the day ends half an hour before (L2-195).</summary>
    public TimeOnly? YoungestBedtime { get; set; }

    /// <summary>Sunday's dinner is at home rather than a restaurant (L2-187).</summary>
    public bool SundayDinnerAtHome { get; set; } = true;

    /// <summary>The family's pace: outings a day (L2-184, L2-195).</summary>
    public int OutingsPerDay { get; set; } = 2;

    public PlanLeaning Leaning { get; set; } = PlanLeaning.Either;

    public List<FamilyMember> Members { get; set; } = new();
    public List<Commitment> Commitments { get; set; } = new();
    public List<Preference> Preferences { get; set; } = new();
}
