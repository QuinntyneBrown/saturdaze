using System.Collections.Concurrent;
using Saturdaze.Application.Ingestion;

namespace Saturdaze.Api.Tests.Support;

/// <summary>The regional researcher's web search, from a recorded answer; never the web (ADR-023).</summary>
public sealed class FakeWebSearchClient : IWebSearchClient
{
    /// <summary>The model's final text: a JSON array of catalog rows.</summary>
    public string RawText { get; set; } = "[]";

    /// <summary>The URLs the "search" returned; research rows must cite one of them (L2-209 AC5).</summary>
    public List<string> SearchResultUrls { get; set; } = new();

    public int Searches { get; set; } = 3;

    public ConcurrentQueue<(string System, string User)> Requests { get; } = new();

    public void Reset()
    {
        RawText = "[]";
        SearchResultUrls = new();
        Searches = 3;
        while (Requests.TryDequeue(out _)) { }
    }

    public Task<WebSearchResult> SearchAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default)
    {
        Requests.Enqueue((systemPrompt, userPrompt));
        return Task.FromResult(new WebSearchResult(RawText, 5000, 800, Searches) { SearchResultUrls = SearchResultUrls.ToList() });
    }
}
