using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Ingestion;

namespace Saturdaze.Infrastructure.Ingestion;

/// <summary>
/// The one concrete <see cref="IWebSearchClient"/>: a thin wrapper over the
/// Anthropic Messages API with the server-side <c>web_search</c> tool enabled.
/// The model runs the multi-step "search a few venue pages, then summarise"
/// loop internally; from here it is a single <c>POST /v1/messages</c> out and a
/// parsed result in. Centralises the API key, model id, and search budget so
/// nothing else in the codebase touches Anthropic directly.
/// </summary>
public sealed class ClaudeWebSearchClient : IWebSearchClient
{
    public const string HttpClientName = "AnthropicClaude";

    private readonly HttpClient _http;
    private readonly ClaudeWebSearchOptions _options;
    private readonly ILogger<ClaudeWebSearchClient> _logger;
    private readonly TimeSpan _retryDelay;

    public ClaudeWebSearchClient(
        HttpClient http, IOptions<ClaudeWebSearchOptions> options, ILogger<ClaudeWebSearchClient> logger)
        : this(http, options.Value, logger, TimeSpan.FromSeconds(Math.Max(0, options.Value.RetryDelaySeconds))) { }

    internal ClaudeWebSearchClient(
        HttpClient http, ClaudeWebSearchOptions options, ILogger<ClaudeWebSearchClient> logger, TimeSpan retryDelay)
    {
        _http = http;
        _options = options;
        _logger = logger;
        _retryDelay = retryDelay;
    }

    public async Task<WebSearchResult> SearchAsync(
        string systemPrompt, string userPrompt, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
            throw new ClaudeApiException(
                "ANTHROPIC_API_KEY is not configured. Set it as an environment variable (or Saturdaze:Ingestion:Claude:ApiKey) before running ingestion.");

        var body = BuildRequestBody(systemPrompt, userPrompt);

        using var response = await SendWithRetryAsync(() => BuildRequest(body), cancellationToken);
        var payload = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
            throw new ClaudeApiException(
                $"Anthropic API returned {(int)response.StatusCode} ({response.StatusCode}): {Snippet(payload)}");

        try
        {
            return ParseResponse(payload);
        }
        catch (JsonException ex)
        {
            throw new ClaudeApiException("Anthropic API returned a response that could not be parsed.", ex);
        }
    }

    private string BuildRequestBody(string systemPrompt, string userPrompt)
    {
        var request = new
        {
            model = _options.Model,
            max_tokens = _options.MaxTokens,
            system = systemPrompt,
            messages = new[] { new { role = "user", content = userPrompt } },
            tools = new object[]
            {
                new Dictionary<string, object?>
                {
                    ["type"] = "web_search_20250305",
                    ["name"] = "web_search",
                    ["max_uses"] = _options.MaxSearches
                }
            }
        };
        return JsonSerializer.Serialize(request);
    }

    private HttpRequestMessage BuildRequest(string body)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "v1/messages")
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };
        request.Headers.Add("x-api-key", _options.ApiKey);
        request.Headers.Add("anthropic-version", _options.AnthropicVersion);
        return request;
    }

    /// <summary>
    /// Sends the request, retrying exactly once (after a back-off) when the first
    /// attempt is rate-limited (429), hits a server error (5xx), or throws a
    /// transient network error. Caller cancellation is never retried.
    /// </summary>
    private async Task<HttpResponseMessage> SendWithRetryAsync(
        Func<HttpRequestMessage> requestFactory, CancellationToken ct)
    {
        try
        {
            var response = await _http.SendAsync(requestFactory(), ct);
            if (!ShouldRetry(response.StatusCode))
                return response;

            _logger.LogWarning(
                "Anthropic API returned {Status}; retrying once in {Delay}s.",
                (int)response.StatusCode, _retryDelay.TotalSeconds);
            response.Dispose();
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            _logger.LogWarning(ex, "Anthropic API request errored; retrying once in {Delay}s.", _retryDelay.TotalSeconds);
        }

        await Task.Delay(_retryDelay, ct);

        try
        {
            return await _http.SendAsync(requestFactory(), ct);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            throw new ClaudeApiException("Anthropic API request failed after one retry.", ex);
        }
    }

    private static bool ShouldRetry(HttpStatusCode status)
        => status == HttpStatusCode.TooManyRequests || (int)status >= 500;

    /// <summary>
    /// Pulls the assistant's text out of the message content blocks (skipping the
    /// tool-use / tool-result blocks the web_search loop emits) and reads token
    /// usage and the web-search count from the <c>usage</c> block.
    /// </summary>
    private static WebSearchResult ParseResponse(string payload)
    {
        using var doc = JsonDocument.Parse(payload);
        var root = doc.RootElement;

        var text = new StringBuilder();
        var searchBlocks = 0;

        if (root.TryGetProperty("content", out var content) && content.ValueKind == JsonValueKind.Array)
        {
            foreach (var block in content.EnumerateArray())
            {
                if (!block.TryGetProperty("type", out var typeProp))
                    continue;
                var type = typeProp.GetString();

                if (type == "text" && block.TryGetProperty("text", out var t))
                    text.Append(t.GetString());
                else if (type == "server_tool_use"
                         && block.TryGetProperty("name", out var n)
                         && n.GetString() == "web_search")
                    searchBlocks++;
            }
        }

        int inputTokens = 0, outputTokens = 0, searchRequests = searchBlocks;
        if (root.TryGetProperty("usage", out var usage) && usage.ValueKind == JsonValueKind.Object)
        {
            if (usage.TryGetProperty("input_tokens", out var i) && i.ValueKind == JsonValueKind.Number)
                inputTokens = i.GetInt32();
            if (usage.TryGetProperty("output_tokens", out var o) && o.ValueKind == JsonValueKind.Number)
                outputTokens = o.GetInt32();
            if (usage.TryGetProperty("server_tool_use", out var stu)
                && stu.ValueKind == JsonValueKind.Object
                && stu.TryGetProperty("web_search_requests", out var wsr)
                && wsr.ValueKind == JsonValueKind.Number)
                searchRequests = wsr.GetInt32();
        }

        return new WebSearchResult(text.ToString(), inputTokens, outputTokens, searchRequests);
    }

    private static string Snippet(string payload)
    {
        var cleaned = payload.ReplaceLineEndings(" ").Trim();
        return cleaned.Length <= 500 ? cleaned : cleaned[..500];
    }
}
