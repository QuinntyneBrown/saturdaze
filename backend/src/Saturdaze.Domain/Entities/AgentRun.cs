using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

/// <summary>
/// One attempt to draft one family's weekend with the agents (L2-208): its trigger, outcome,
/// usage, cost and trace. Append-then-close like <see cref="IngestionRun"/>; it holds no prompt
/// text, member names or address.
/// </summary>
public class AgentRun
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public DateOnly WeekendOf { get; set; }
    public AgentRunTrigger Trigger { get; set; }
    public AgentRunStatus Status { get; set; }
    public AgentFallbackReason? FallbackReason { get; set; }

    /// <summary>The first failure, at most 2000 characters, never prompt text.</summary>
    public string? Error { get; set; }

    public DateTimeOffset QueuedUtc { get; set; }
    public DateTimeOffset? StartedUtc { get; set; }
    public DateTimeOffset? FinishedUtc { get; set; }

    /// <summary>Drafter rounds that reached the validator.</summary>
    public int Rounds { get; set; }

    public int ModelCalls { get; set; }
    public int ToolCalls { get; set; }
    public int WebSearches { get; set; }
    public int InputTokens { get; set; }
    public int OutputTokens { get; set; }
    public decimal CostUsd { get; set; }

    /// <summary>Policy-control violations, one per line ("tool: ...", "output: ..."), at most 4000 characters.</summary>
    public string? PolicyViolations { get; set; }

    /// <summary>The W3C trace id of the run's <c>plan_weekend</c> span.</summary>
    public string? TraceId { get; set; }
}
