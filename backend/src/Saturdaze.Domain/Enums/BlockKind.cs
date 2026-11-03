namespace Saturdaze.Domain.Enums;

/// <summary>Explicit values: these are persisted as integers.</summary>
public enum BlockKind
{
    Activity = 2,
    Meal = 3,
    Drive = 4,
    Downtime = 5,
    Commitment = 6,
    Errand = 7,

    /// <summary>A couple's date (L2-222): one locked block for its whole window.</summary>
    Date = 8
}
