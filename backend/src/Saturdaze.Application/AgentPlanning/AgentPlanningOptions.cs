namespace Saturdaze.Application.AgentPlanning;

/// <summary>How agent planning authenticates to Microsoft Foundry (L2-213).</summary>
public enum AgentAuth
{
    /// <summary><c>x-api-key</c> from <c>ANTHROPIC_FOUNDRY_API_KEY</c>, as ingestion does (ADR-011).</summary>
    Key,

    /// <summary>A Microsoft Entra bearer token from the host's managed identity (ADR-023).</summary>
    ManagedIdentity
}

/// <summary>
/// Agent planning's settings, bound from <c>Saturdaze:AgentPlanning</c> (L2-207, L2-213, ADR-023).
/// Off by default; every cap and price has a default that keeps a weekly cadence for a few
/// families well inside the resource group's budget.
/// </summary>
public sealed class AgentPlanningOptions
{
    public const string SectionName = "Saturdaze:AgentPlanning";

    public bool Enabled { get; set; }
    public AgentAuth Auth { get; set; } = AgentAuth.Key;

    /// <summary>The Foundry resource (custom subdomain), e.g. <c>sd-ai-uofnt2</c>.</summary>
    public string FoundryResource { get; set; } = string.Empty;

    public string ResearcherModel { get; set; } = "claude-sonnet-5";
    public string CuratorModel { get; set; } = "claude-sonnet-5";
    public string DrafterModel { get; set; } = "claude-sonnet-5";

    /// <summary>Output token ceiling per model call.</summary>
    public int MaxOutputTokens { get; set; } = 4096;

    /// <summary>Drafter revisions after the first round (L2-202).</summary>
    public int MaxCriticRounds { get; set; } = 2;

    public int RunTimeoutSeconds { get; set; } = 300;

    // Per-run caps (L2-207).
    public int MaxModelCallsPerRun { get; set; } = 12;
    public int MaxToolCallsPerRun { get; set; } = 40;
    public int MaxWebSearchesPerRun { get; set; } = 5;
    public int MaxTokensPerRun { get; set; } = 250_000;

    // Across runs (L2-203, L2-207).
    public int MaxRunsPerDay { get; set; } = 60;
    public int MaxOnDemandRunsPerWeekend { get; set; } = 3;
    public decimal MonthlySpendCapUsd { get; set; } = 25m;

    // Prices, US$ (claude-sonnet-5 on Foundry at first-party rates; web search per 1,000).
    public decimal PriceInputPerMTokUsd { get; set; } = 2m;
    public decimal PriceOutputPerMTokUsd { get; set; } = 10m;
    public decimal PricePerThousandSearchesUsd { get; set; } = 10m;

    /// <summary>Regional research is reused by every family in its cell for this many days.</summary>
    public int ResearchReuseDays { get; set; } = 6;

    /// <summary>How far the regional researcher looks around its cell centre, in minutes' drive.</summary>
    public int ResearchRadiusMinutes { get; set; } = 120;

    /// <summary>How often the API's processor looks for queued on-demand drafts.</summary>
    public int QueuePollSeconds { get; set; } = 5;

    public AgentControlsOptions Controls { get; set; } = new();
}

/// <summary>The ACS-style policy controls (L2-209). Off only to measure the "before" baseline in ASSERT.</summary>
public sealed class AgentControlsOptions
{
    public bool Enabled { get; set; } = true;
}
