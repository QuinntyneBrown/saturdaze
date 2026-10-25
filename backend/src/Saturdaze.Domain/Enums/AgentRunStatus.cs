namespace Saturdaze.Domain.Enums;

/// <summary>Where an agent draft run is (L2-203). Explicit values: persisted as integers.</summary>
public enum AgentRunStatus
{
    Queued = 0,
    Running = 1,
    Applied = 2,
    FellBack = 3
}
