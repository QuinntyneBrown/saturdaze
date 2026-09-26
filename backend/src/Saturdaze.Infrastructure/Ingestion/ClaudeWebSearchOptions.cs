namespace Saturdaze.Infrastructure.Ingestion;

/// <summary>Where the Claude Messages API is served from.</summary>
public enum ClaudeProvider
{
    /// <summary>Claude deployed in Microsoft Foundry (<c>{resource}.services.ai.azure.com/anthropic</c>). The default.</summary>
    Foundry,

    /// <summary>Anthropic's own API (<c>api.anthropic.com</c>). Kept as a fallback.</summary>
    Anthropic
}

/// <summary>
/// Provider-specific settings for <see cref="ClaudeWebSearchClient"/>, bound from
/// <c>Saturdaze:Ingestion:Claude</c>. Both providers speak the same Messages API;
/// they differ only in base URL and in which environment variable holds the key.
/// <see cref="ApiKey"/> is overridden from that variable at registration time
/// (the same secret pattern used for the JWT signing key) and is never logged.
/// </summary>
public sealed class ClaudeWebSearchOptions
{
    public const string SectionName = "Saturdaze:Ingestion:Claude";

    public const string FoundryApiKeyVariable = "ANTHROPIC_FOUNDRY_API_KEY";
    public const string AnthropicApiKeyVariable = "ANTHROPIC_API_KEY";

    public ClaudeProvider Provider { get; set; } = ClaudeProvider.Foundry;

    /// <summary>
    /// Foundry resource (custom subdomain) name, e.g. <c>sd-ai-uofnt2</c>. Used to
    /// build the base URL when <see cref="BaseUrl"/> is blank.
    /// </summary>
    public string FoundryResource { get; set; } = string.Empty;

    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Model id (Anthropic) or deployment name (Foundry). Sonnet is the quality
    /// default; Haiku is cheaper.
    /// </summary>
    public string Model { get; set; } = "claude-sonnet-5";

    /// <summary>Upper bound on internal <c>web_search</c> tool calls per request.</summary>
    public int MaxSearches { get; set; } = 5;

    /// <summary>Output token ceiling. The JSON array of rows is small; 4k is ample.</summary>
    public int MaxTokens { get; set; } = 4096;

    /// <summary>Explicit endpoint override. Blank means "derive from the provider".</summary>
    public string BaseUrl { get; set; } = string.Empty;

    public string AnthropicVersion { get; set; } = "2023-06-01";

    /// <summary>Back-off before the single automatic retry on 429/5xx.</summary>
    public int RetryDelaySeconds { get; set; } = 30;

    /// <summary>The environment variable that holds the key for <paramref name="provider"/>.</summary>
    public static string ApiKeyVariable(ClaudeProvider provider)
        => provider == ClaudeProvider.Foundry ? FoundryApiKeyVariable : AnthropicApiKeyVariable;

    /// <summary>
    /// Resolves the endpoint: an explicit <see cref="BaseUrl"/> wins, then the
    /// provider default. Returns <c>null</c> when Foundry has no resource name, so
    /// hosts that never ingest (e.g. <c>saturdaze migrate</c>) still start. The
    /// result always ends in <c>/</c>: without it the relative <c>v1/messages</c>
    /// would replace the <c>/anthropic</c> segment of a Foundry URL.
    /// </summary>
    public static Uri? ResolveBaseUri(ClaudeWebSearchOptions options)
    {
        var url = options.BaseUrl?.Trim();
        if (string.IsNullOrEmpty(url))
        {
            url = options.Provider switch
            {
                ClaudeProvider.Anthropic => "https://api.anthropic.com/",
                _ when !string.IsNullOrWhiteSpace(options.FoundryResource)
                    => $"https://{options.FoundryResource.Trim()}.services.ai.azure.com/anthropic/",
                _ => null
            };
        }

        if (url is null)
            return null;
        if (!url.EndsWith('/'))
            url += "/";
        return new Uri(url, UriKind.Absolute);
    }

    /// <summary>
    /// The provider's environment variable wins over configured key material.
    /// Only that provider's variable is consulted, so an <c>ANTHROPIC_API_KEY</c>
    /// exported for other tools is never sent to Foundry.
    /// </summary>
    public static string ResolveApiKey(ClaudeWebSearchOptions options, Func<string, string?> environment)
    {
        var fromEnvironment = environment(ApiKeyVariable(options.Provider));
        return string.IsNullOrWhiteSpace(fromEnvironment) ? options.ApiKey : fromEnvironment;
    }
}
