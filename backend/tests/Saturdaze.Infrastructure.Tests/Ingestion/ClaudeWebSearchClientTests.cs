using System.Net;
using System.Text;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Saturdaze.Infrastructure.Ingestion;
using Xunit;

namespace Saturdaze.Infrastructure.Tests.Ingestion;

public class ClaudeWebSearchClientTests
{
    private const string SampleResponse = """
        {
          "id": "msg_1",
          "type": "message",
          "role": "assistant",
          "content": [
            { "type": "server_tool_use", "id": "t1", "name": "web_search", "input": {"query":"events"} },
            { "type": "web_search_tool_result", "tool_use_id": "t1", "content": [] },
            { "type": "text", "text": "Here are the events: " },
            { "type": "text", "text": "[{\"name\":\"X\"}]" }
          ],
          "usage": {
            "input_tokens": 1234,
            "output_tokens": 56,
            "server_tool_use": { "web_search_requests": 3 }
          }
        }
        """;

    private static ClaudeWebSearchClient CreateClient(FakeHandler handler, ClaudeWebSearchOptions? options = null)
    {
        var http = new HttpClient(handler) { BaseAddress = new Uri("https://api.anthropic.com/") };
        options ??= new ClaudeWebSearchOptions { ApiKey = "sk-test", Model = "claude-sonnet-4-6", MaxSearches = 5 };
        return new ClaudeWebSearchClient(http, options, NullLogger<ClaudeWebSearchClient>.Instance, TimeSpan.Zero);
    }

    [Fact]
    public async Task Sends_a_well_formed_messages_request_with_the_web_search_tool()
    {
        var handler = new FakeHandler(SampleResponse);
        var client = CreateClient(handler);

        await client.SearchAsync("SYSTEM PROMPT", "USER PROMPT");

        handler.LastRequest!.Method.Should().Be(HttpMethod.Post);
        handler.LastRequest.RequestUri!.AbsolutePath.Should().Be("/v1/messages");
        handler.LastRequest.Headers.GetValues("x-api-key").Should().ContainSingle().Which.Should().Be("sk-test");
        handler.LastRequest.Headers.GetValues("anthropic-version").Should().ContainSingle().Which.Should().Be("2023-06-01");

        handler.LastBody.Should().Contain("\"model\":\"claude-sonnet-4-6\"");
        handler.LastBody.Should().Contain("web_search_20250305");
        handler.LastBody.Should().Contain("\"max_uses\":5");
        handler.LastBody.Should().Contain("SYSTEM PROMPT");
        handler.LastBody.Should().Contain("USER PROMPT");
    }

    [Fact]
    public async Task Concatenates_text_blocks_and_reads_usage()
    {
        var client = CreateClient(new FakeHandler(SampleResponse));

        var result = await client.SearchAsync("s", "u");

        result.RawText.Should().Be("Here are the events: [{\"name\":\"X\"}]");
        result.InputTokens.Should().Be(1234);
        result.OutputTokens.Should().Be(56);
        result.WebSearchCount.Should().Be(3);
    }

    [Fact]
    public async Task Falls_back_to_counting_tool_use_blocks_when_usage_omits_the_count()
    {
        const string noUsageCount = """
            {
              "content": [
                { "type": "server_tool_use", "name": "web_search" },
                { "type": "server_tool_use", "name": "web_search" },
                { "type": "text", "text": "[]" }
              ],
              "usage": { "input_tokens": 10, "output_tokens": 2 }
            }
            """;

        var result = await CreateClient(new FakeHandler(noUsageCount)).SearchAsync("s", "u");

        result.WebSearchCount.Should().Be(2);
    }

    [Fact]
    public async Task Throws_without_calling_http_when_api_key_is_missing()
    {
        var handler = new FakeHandler(SampleResponse);
        var client = CreateClient(handler, new ClaudeWebSearchOptions { ApiKey = "" });

        var act = () => client.SearchAsync("s", "u");

        await act.Should().ThrowAsync<ClaudeApiException>().WithMessage("*ANTHROPIC_API_KEY*");
        handler.Calls.Should().Be(0);
    }

    [Fact]
    public async Task Surfaces_a_non_retryable_error_as_ClaudeApiException()
    {
        var handler = new FakeHandler(HttpStatusCode.BadRequest, """{"error":{"message":"bad model"}}""");
        var client = CreateClient(handler);

        var act = () => client.SearchAsync("s", "u");

        (await act.Should().ThrowAsync<ClaudeApiException>()).Which.Message.Should().Contain("400").And.Contain("bad model");
        handler.Calls.Should().Be(1); // 400 is not retried
    }

    [Fact]
    public async Task Retries_once_on_429_then_succeeds()
    {
        var handler = new FakeHandler(new[]
        {
            (HttpStatusCode.TooManyRequests, "{}"),
            (HttpStatusCode.OK, SampleResponse)
        });
        var client = CreateClient(handler);

        var result = await client.SearchAsync("s", "u");

        handler.Calls.Should().Be(2);
        result.InputTokens.Should().Be(1234);
    }

    [Fact]
    public async Task Retries_once_on_500_then_gives_up()
    {
        var handler = new FakeHandler(new[]
        {
            (HttpStatusCode.InternalServerError, "boom"),
            (HttpStatusCode.InternalServerError, "boom again")
        });
        var client = CreateClient(handler);

        var act = () => client.SearchAsync("s", "u");

        await act.Should().ThrowAsync<ClaudeApiException>();
        handler.Calls.Should().Be(2);
    }

    private sealed class FakeHandler : HttpMessageHandler
    {
        private readonly Queue<(HttpStatusCode Status, string Body)> _responses = new();

        public FakeHandler(string body) => _responses.Enqueue((HttpStatusCode.OK, body));
        public FakeHandler(HttpStatusCode status, string body) => _responses.Enqueue((status, body));
        public FakeHandler(IEnumerable<(HttpStatusCode, string)> responses)
        {
            foreach (var r in responses) _responses.Enqueue(r);
        }

        public int Calls { get; private set; }
        public HttpRequestMessage? LastRequest { get; private set; }
        public string? LastBody { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Calls++;
            LastRequest = request;
            LastBody = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);

            var (status, body) = _responses.Count > 1 ? _responses.Dequeue() : _responses.Peek();
            return new HttpResponseMessage(status)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json")
            };
        }
    }
}
