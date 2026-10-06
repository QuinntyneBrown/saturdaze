// Traces to: L2-111, L2-113
using System.Net;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Api.Tests.Admin;

/// <summary>
/// Every <c>/api/admin/*</c> endpoint sits behind the Admin policy on top of the
/// authenticated fallback (L2-111 AC2, AC3). The Places list is the first one.
/// </summary>
public class AdminAccessTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    public AdminAccessTests(SaturdazeApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Anonymous_request_to_an_admin_endpoint_is_401()
    {
        // Traces to: L2-111 AC3
        var res = await _factory.CreateClient().GetAsync("/api/admin/places");
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Non_admin_token_on_an_admin_endpoint_is_403()
    {
        // Traces to: L2-111 AC2
        var user = await SignedInClient.CreateAsync(_factory);
        var res = await user.Client.GetAsync("/api/admin/places");
        res.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Admin_lists_catalog_places_across_the_three_catalogs()
    {
        // Traces to: L2-113
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var res = await admin.Client.GetAsync("/api/admin/places");
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);

        var items = JsonDocument.Parse(body).RootElement.GetProperty("items").EnumerateArray().ToList();
        var byName = items.ToDictionary(i => i.GetProperty("name").GetString()!, i => i);

        byName.Should().ContainKey("Port Credit Memorial Park");
        byName["Port Credit Memorial Park"].GetProperty("kind").GetString().Should().Be("Activity");
        byName["Port Credit Memorial Park"].GetProperty("photoCount").GetInt32().Should().Be(2);
        byName["Port Credit Memorial Park"].GetProperty("photo").GetProperty("url").GetString()
            .Should().Be("https://images.example.com/memorial-park.jpg");

        byName.Should().ContainKey("Snug Harbour");
        byName["Snug Harbour"].GetProperty("kind").GetString().Should().Be("Restaurant");
        byName.Should().ContainKey("Mississauga Waterfront Festival");
        byName["Mississauga Waterfront Festival"].GetProperty("kind").GetString().Should().Be("LocalEvent");

        byName["Stratford Festival (family matinee)"].GetProperty("photoCount").GetInt32().Should().Be(0);
        byName["Stratford Festival (family matinee)"].GetProperty("photo").ValueKind.Should().Be(JsonValueKind.Null);
    }
}
