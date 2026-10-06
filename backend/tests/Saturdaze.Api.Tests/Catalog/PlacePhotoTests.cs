using System.Net;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.Catalog;

/// <summary>L2-100 / L2-101 AC3: lists expose each place's primary photo, safely, or null.</summary>
public class PlacePhotoTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private HttpClient _client = null!;

    public PlacePhotoTests(SaturdazeApiFactory factory) => _factory = factory;

    public async Task InitializeAsync() => _client = (await SignedInClient.CreateAsync(_factory)).Client;
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<JsonElement> Item(string url, string name)
    {
        var res = await _client.GetAsync(url);
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        return JsonDocument.Parse(body).RootElement.EnumerateArray()
            .Single(e => e.GetProperty("name").GetString() == name);
    }

    [Fact]
    public async Task A_place_projects_its_primary_photo_with_attribution()
    {
        // Traces to: L2-100
        var photo = (await Item("/api/activities", "Port Credit Memorial Park")).GetProperty("photo");

        photo.GetProperty("url").GetString().Should().Be("https://images.example.com/memorial-park.jpg");
        photo.GetProperty("width").GetInt32().Should().Be(1200);
        photo.GetProperty("height").GetInt32().Should().Be(675);
        photo.GetProperty("alt").GetString().Should().Be("Lawn running down to the lake");
        photo.GetProperty("attribution").GetString().Should().Be("Photo · Jo Doe");
    }

    [Fact]
    public async Task A_place_without_photos_projects_null()
    {
        // Traces to: L2-100 AC3
        var item = await Item("/api/activities", "Stratford Festival (family matinee)");
        item.GetProperty("photo").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task Empty_alt_text_falls_back_to_the_place_name()
    {
        // Traces to: L2-100 AC4
        var photo = (await Item("/api/activities", "Jack Darling Memorial Park")).GetProperty("photo");
        photo.GetProperty("alt").GetString().Should().Be("Photo of Jack Darling Memorial Park");
    }

    [Theory]
    [InlineData("Rec Room Mississauga")] // http://, not HTTPS
    [InlineData("Toronto Zoo")]          // HTTPS, but not an allowed origin
    public async Task Photos_outside_the_https_allow_list_project_null(string name)
    {
        // Traces to: L2-101 AC3
        var item = await Item("/api/activities", name);
        item.GetProperty("photo").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task Restaurant_and_event_lists_carry_photos_too()
    {
        // Traces to: L2-100
        var restaurant = await Item("/api/restaurants?day=2026-05-16&slot=Dinner&wifeApprovedOnly=false", "Snug Harbour");
        restaurant.GetProperty("photo").GetProperty("url").GetString()
            .Should().Be("https://images.example.com/snug-harbour.jpg");

        var ev = await Item("/api/events?weekendOf=2026-06-13", "Mississauga Waterfront Festival");
        ev.GetProperty("photo").GetProperty("alt").GetString().Should().Be("Stage by the water");
    }
}
