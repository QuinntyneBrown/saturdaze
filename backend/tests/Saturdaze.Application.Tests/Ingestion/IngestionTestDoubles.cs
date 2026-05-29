using Saturdaze.Application.Common;
using Saturdaze.Application.Ingestion;

namespace Saturdaze.Application.Tests.Ingestion;

/// <summary>Deterministic clock for ingestion tests.</summary>
internal sealed class FixedClock : IDateTimeProvider
{
    public FixedClock(DateTimeOffset now)
    {
        UtcNow = now;
        Today = DateOnly.FromDateTime(now.UtcDateTime);
    }

    public DateTimeOffset UtcNow { get; }
    public DateOnly Today { get; }
}

/// <summary>
/// Scripted <see cref="IWebSearchClient"/>: returns a queued response (or a
/// single fixed one), records the prompts it was called with, and can be told
/// to throw to exercise the failure path. No HTTP.
/// </summary>
internal sealed class FakeWebSearchClient : IWebSearchClient
{
    private readonly Queue<WebSearchResult> _responses = new();
    private readonly WebSearchResult? _fixed;
    private readonly Exception? _throw;

    public FakeWebSearchClient(WebSearchResult fixedResponse) => _fixed = fixedResponse;
    public FakeWebSearchClient(Exception toThrow) => _throw = toThrow;
    public FakeWebSearchClient(IEnumerable<WebSearchResult> responses)
    {
        foreach (var r in responses) _responses.Enqueue(r);
    }

    public int Calls { get; private set; }
    public string? LastSystemPrompt { get; private set; }
    public string? LastUserPrompt { get; private set; }

    public Task<WebSearchResult> SearchAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default)
    {
        Calls++;
        LastSystemPrompt = systemPrompt;
        LastUserPrompt = userPrompt;

        if (_throw is not null) throw _throw;
        if (_fixed is not null) return Task.FromResult(_fixed);
        return Task.FromResult(_responses.Dequeue());
    }
}
