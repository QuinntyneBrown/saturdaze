namespace Saturdaze.Application.Ingestion;

/// <summary>
/// Abstraction over an LLM-with-web-search provider. One implementation today
/// (<c>ClaudeWebSearchClient</c> in Infrastructure, calling Anthropic's Messages
/// API with the <c>web_search</c> tool). The interface lives in Application so
/// <see cref="IngestionRunner"/> can be unit-tested with a fake and so the
/// dependency direction stays Domain &lt;- Application &lt;- Infrastructure, the
/// same shape as <c>IWeatherClient</c>/<c>OpenMeteoWeatherClient</c>.
/// </summary>
public interface IWebSearchClient
{
    /// <summary>
    /// Sends one grounded research request. The implementation is responsible
    /// for the internal multi-step web-search loop; from the caller's point of
    /// view this is a single request returning the model's final text plus
    /// usage metadata.
    /// </summary>
    Task<WebSearchResult> SearchAsync(
        string systemPrompt,
        string userPrompt,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// The provider-agnostic result of a single <see cref="IWebSearchClient.SearchAsync"/>
/// call. <see cref="RawText"/> is the model's final assistant text (expected to
/// contain a JSON array); the rest is usage metadata recorded on the audit row.
/// </summary>
public sealed record WebSearchResult(
    string RawText,
    int InputTokens,
    int OutputTokens,
    int WebSearchCount);
