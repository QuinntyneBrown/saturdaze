namespace Saturdaze.Infrastructure.Ingestion;

/// <summary>
/// Thrown by <see cref="ClaudeWebSearchClient"/> when the Claude API (Foundry or
/// Anthropic) is not configured, cannot be reached, or returns a non-success
/// status after the single retry. The
/// ingestion runner catches it and records the pass as
/// <c>IngestionStatus.Failed</c>.
/// </summary>
public sealed class ClaudeApiException : Exception
{
    public ClaudeApiException(string message) : base(message) { }

    public ClaudeApiException(string message, Exception innerException) : base(message, innerException) { }
}
