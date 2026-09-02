// Traces to: L2-008
using System.Net;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.Auth;

/// <summary>
/// The fallback authorization policy: everything is 401 without a bearer
/// except the documented anonymous surface.
/// </summary>
public class AuthorizationPolicyTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    public AuthorizationPolicyTests(SaturdazeApiFactory factory) => _factory = factory;

    [Theory]
    [InlineData("GET", "/api/weekends/current")]
    [InlineData("GET", "/api/weekends/8b1c1d3e-0000-4000-8000-000000000001")]
    [InlineData("GET", "/api/weekends/history")]
    [InlineData("GET", "/api/family")]
    [InlineData("GET", "/api/activities")]
    [InlineData("GET", "/api/restaurants?day=2026-05-16&slot=Dinner")]
    [InlineData("GET", "/api/events?weekendOf=2026-06-13")]
    [InlineData("POST", "/api/_ping")]
    [InlineData("GET", "/api/events/submissions/mine")]
    public async Task Protected_routes_return_401_without_a_bearer(string method, string url)
    {
        var client = _factory.CreateClient();
        using var request = new HttpRequestMessage(new HttpMethod(method), url);
        var response = await client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized, $"{method} {url}");
    }

    [Fact]
    public async Task Weather_is_public()
    {
        var response = await _factory.CreateClient().GetAsync("/api/weather?weekendOf=2026-05-16");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Swagger_document_stays_reachable_outside_production()
    {
        // Guards the middleware order: the fallback policy would 401 Swagger
        // if it were registered below UseAuthorization.
        var response = await _factory.CreateClient().GetAsync("/swagger/v1/swagger.json");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Signed_in_user_passes_the_fallback_policy()
    {
        var session = await SignedInClient.CreateAsync(_factory);
        var response = await session.Client.GetAsync("/api/activities");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
