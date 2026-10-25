namespace Saturdaze.Domain.Enums;

/// <summary>Why a run left the planner's weekend in place (L2-205). Explicit values: persisted as integers.</summary>
public enum AgentFallbackReason
{
    Disabled = 0,
    Error = 1,
    Timeout = 2,
    Budget = 3,
    Policy = 4,
    Invalid = 5
}
