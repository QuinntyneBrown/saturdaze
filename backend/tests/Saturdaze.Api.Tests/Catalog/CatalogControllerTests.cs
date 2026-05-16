using System.Net;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.Catalog;

public class CatalogControllerTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly HttpClient _client;

    public CatalogControllerTests(SaturdazeApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Activities_returns_seeded_activities()
    {
        var response = await _client.GetAsync("/api/activities");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var arr = JsonDocument.Parse(body).RootElement;
        arr.GetArrayLength().Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Activities_filtered_by_indoor_only_returns_indoor()
    {
        var response = await _client.GetAsync("/api/activities?indoor=true");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var arr = JsonDocument.Parse(body).RootElement.EnumerateArray().ToArray();
        arr.Should().NotBeEmpty();
        arr.Should().OnlyContain(e => e.GetProperty("indoor").GetBoolean());
    }

    [Fact]
    public async Task Restaurants_filtered_by_dinner_slot_returns_dinner()
    {
        var response = await _client.GetAsync("/api/restaurants?day=2026-05-16&slot=Dinner");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var arr = JsonDocument.Parse(body).RootElement.EnumerateArray().ToArray();
        arr.Should().NotBeEmpty();
        arr.Should().OnlyContain(e => e.GetProperty("slot").GetString() == "Dinner");
    }

    [Fact]
    public async Task Events_filtered_by_weekend_overlap()
    {
        var response = await _client.GetAsync("/api/events?weekendOf=2026-06-13");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        JsonDocument.Parse(body).RootElement.ValueKind.Should().Be(JsonValueKind.Array);
    }
}
