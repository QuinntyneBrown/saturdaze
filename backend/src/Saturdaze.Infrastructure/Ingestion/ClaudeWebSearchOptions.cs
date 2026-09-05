namespace Saturdaze.Infrastructure.Ingestion;

/// <summary>
/// Provider-specific settings for <see cref="ClaudeWebSearchClient"/>, bound from
/// <c>Saturdaze:Ingestion:Claude</c>. <see cref="ApiKey"/> is overridden from the
/// <c>ANTHROPIC_API_KEY</c> environment variable at registration time (the same
/// secret pattern used for the JWT signing key) and is never logged.
/// </summary>
public sealed class ClaudeWebSearchOptions
{
    public const string SectionName = "Saturdaze:Ingestion:Claude";

    public string ApiKey { get; set; } = string.Empty;

    /// <summary>Anthropic model id. Sonnet is the quality default; Haiku is cheaper.</summary>
    public string Model { get; set; } = "claude-sonnet-4-6";

    /// <summary>Upper bound on internal <c>web_search</c> tool calls per request.</summary>
    public int MaxSearches { get; set; } = 5;

    /// <summary>Output token ceiling. The JSON array of rows is small; 4k is ample.</summary>
    public int MaxTokens { get; set; } = 4096;

    public string BaseUrl { get; set; } = "https://api.anthropic.com/";

    public string AnthropicVersion { get; set; } = "2023-06-01";

    /// <summary>Back-off before the single automatic retry on 429/5xx.</summary>
    public int RetryDelaySeconds { get; set; } = 30;
}
