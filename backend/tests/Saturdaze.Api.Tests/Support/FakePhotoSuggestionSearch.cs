using Saturdaze.Application.Ingestion;

namespace Saturdaze.Api.Tests.Support;

/// <summary>
/// Test-controlled Claude: answers every research request with <see cref="RawText"/>
/// (a JSON array of candidates, possibly wrapped in prose) or throws when <see cref="Fail"/>
/// is set, and records the prompts it was sent.
/// </summary>
public sealed class FakePhotoSuggestionSearch : IWebSearchClient
{
    public string RawText { get; set; } = "[]";
    public bool Fail { get; set; }
    public List<(string System, string User)> Requests { get; } = new();

    public Task<WebSearchResult> SearchAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default)
    {
        Requests.Add((systemPrompt, userPrompt));
        if (Fail) throw new InvalidOperationException("Claude is down");
        return Task.FromResult(new WebSearchResult(RawText, 1234, 56, 3));
    }
}
