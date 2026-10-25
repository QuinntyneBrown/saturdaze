namespace Saturdaze.Domain.Entities;

/// <summary>
/// What a run that reached the validator produced (L2-204): the curator's shortlist, the
/// drafter's final picks with their reasons, and the validator's report. Applying it again
/// gives the same blocks, so a weekend stays reproducible.
/// </summary>
public class WeekendDraft
{
    public Guid Id { get; set; }
    public Guid AgentRunId { get; set; }
    public Guid FamilyId { get; set; }
    public DateOnly WeekendOf { get; set; }
    public string ShortlistJson { get; set; } = "[]";

    /// <summary>The picks that passed the validator, in the order they were placed.</summary>
    public string PicksJson { get; set; } = "[]";

    /// <summary>Every round's violations, JSON.</summary>
    public string ValidatorReport { get; set; } = "[]";

    public bool Applied { get; set; }
    public DateTimeOffset CreatedUtc { get; set; }
}
