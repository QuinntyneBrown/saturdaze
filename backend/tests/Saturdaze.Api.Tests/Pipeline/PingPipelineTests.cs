using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.Pipeline;

public class PingPipelineTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    private readonly HttpClient _client;

    public PingPipelineTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Ok_mode_returns_200_pong()
    {
        var response = await _client.PostAsJsonAsync("/api/_ping", new { Mode = "ok" });
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        payload.GetProperty("message").GetString().Should().Be("pong");
    }

    [Fact]
    public async Task Invalid_mode_returns_400_validation_problem_with_field_errors()
    {
        var response = await _client.PostAsJsonAsync("/api/_ping", new { Mode = "" });
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, $"body: {body}");
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json", $"body: {body}");
        var payload = JsonDocument.Parse(body).RootElement;
        payload.TryGetProperty("title", out var titleProp).Should().BeTrue($"body: {body}");
        titleProp.GetString().Should().Be("Validation failed");

        var errors = payload.GetProperty("errors");
        // ASP.NET preserves dictionary key case by default — but be permissive against future policy changes.
        var modeKey = errors.EnumerateObject()
            .FirstOrDefault(p => string.Equals(p.Name, "Mode", StringComparison.OrdinalIgnoreCase));
        modeKey.Value.ValueKind.Should().Be(JsonValueKind.Array,
            $"validation errors should contain a 'Mode' field; body was: {body}");
        modeKey.Value.EnumerateArray().Should().NotBeEmpty();
    }

    [Fact]
    public async Task NotFound_mode_returns_404_problem_details()
    {
        var response = await _client.PostAsJsonAsync("/api/_ping", new { Mode = "notfound" });
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        payload.GetProperty("title").GetString().Should().Be("Not found");
    }

    [Fact]
    public async Task Conflict_mode_returns_409_problem_details()
    {
        var response = await _client.PostAsJsonAsync("/api/_ping", new { Mode = "conflict" });
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        var payload = await response.Content.ReadFromJsonAsync<JsonElement>();
        payload.GetProperty("title").GetString().Should().Be("Conflict");
    }
}
