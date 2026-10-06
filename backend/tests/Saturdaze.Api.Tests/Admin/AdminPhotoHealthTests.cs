// Traces to: L2-112
using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Admin;

/// <summary>
/// <c>GET /api/admin/photo-health</c> (L2-112) over the fixture catalog: 12 activities (two
/// healthy-or-missing-alt primaries, two blocked URLs, eight without a photo), 8 restaurants
/// (one curated primary) and 3 events (one with a photo), all upcoming from June 2026.
/// </summary>
public class AdminPhotoHealthTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private HttpClient _admin = null!;

    public AdminPhotoHealthTests(SaturdazeApiFactory factory) => _factory = factory;

    public async Task InitializeAsync() => _admin = (await SignedInClient.CreateAsync(_factory, role: UserRole.Admin)).Client;
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<JsonElement> Health()
    {
        var res = await _admin.GetAsync("/api/admin/photo-health");
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        return JsonDocument.Parse(body).RootElement;
    }

    private static JsonElement Catalog(JsonElement health, string catalog) =>
        health.GetProperty("catalogs").EnumerateArray().Single(c => c.GetProperty("catalog").GetString() == catalog);

    private static int N(JsonElement catalog, string field) => catalog.GetProperty(field).GetInt32();

    [Fact]
    public async Task Each_catalog_counts_places_projecting_primaries_and_every_flag()
    {
        // Traces to: L2-112 AC1, AC2, AC3
        var today = _factory.Clock.Today;
        _factory.Clock.Today = new DateOnly(2026, 6, 1);
        try
        {
            var health = await Health();
            health.GetProperty("catalogs").EnumerateArray().Select(c => c.GetProperty("catalog").GetString())
                .Should().Equal("activities", "restaurants", "upcomingEvents");

            var activities = Catalog(health, "activities");
            activities.GetProperty("kind").GetString().Should().Be("Activity");
            N(activities, "places").Should().Be(12);
            N(activities, "withPrimary").Should().Be(2, "a blocked URL does not count as a projecting primary");
            N(activities, "noPhoto").Should().Be(8);
            N(activities, "blockedUrl").Should().Be(2);
            N(activities, "unreviewed").Should().Be(0);
            N(activities, "missingAlt").Should().Be(1);

            var restaurants = Catalog(health, "restaurants");
            N(restaurants, "places").Should().Be(8);
            N(restaurants, "withPrimary").Should().Be(1);
            N(restaurants, "noPhoto").Should().Be(7);

            var events = Catalog(health, "upcomingEvents");
            events.GetProperty("kind").GetString().Should().Be("LocalEvent");
            N(events, "places").Should().Be(3);
            N(events, "withPrimary").Should().Be(1);
            N(events, "noPhoto").Should().Be(2);

            health.GetProperty("pendingReviews").GetInt32().Should().Be(0);

            // The flag count matches the filtered Places list it links to (AC1).
            var res = await _admin.GetAsync("/api/admin/places?kind=Activity&flag=no-photo");
            JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement.GetProperty("total").GetInt32().Should().Be(8);
        }
        finally
        {
            _factory.Clock.Today = today;
        }
    }

    [Fact]
    public async Task Only_upcoming_events_count_and_an_unreviewed_primary_is_flagged()
    {
        // Traces to: L2-112 AC3
        var today = _factory.Clock.Today;
        _factory.Clock.Today = new DateOnly(2026, 7, 1);
        Guid photoId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var place = await db.Restaurants.SingleAsync(r => r.Name == "Spice Lounge");
            var photo = PlacePhoto.Create(PlaceKind.Restaurant, place.Id, "https://images.example.com/spice.jpg",
                1200, 675, "Dining room", "Photo · Provider", PhotoSource.Provider, "Provider terms", primary: true,
                PhotoReviewState.Unreviewed)!;
            db.PlacePhotos.Add(photo);
            await db.SaveChangesAsync();
            photoId = photo.Id;
        }
        try
        {
            var health = await Health();
            var events = Catalog(health, "upcomingEvents");
            N(events, "places").Should().Be(1, "only Buskerfest starts on or after 1 July 2026");
            N(events, "withPrimary").Should().Be(0);
            N(events, "noPhoto").Should().Be(1);

            var restaurants = Catalog(health, "restaurants");
            N(restaurants, "withPrimary").Should().Be(2, "an unreviewed provider photo still projects");
            N(restaurants, "unreviewed").Should().Be(1);
            N(restaurants, "noPhoto").Should().Be(6);
            health.GetProperty("pendingReviews").GetInt32().Should().Be(1);
        }
        finally
        {
            _factory.Clock.Today = today;
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.PlacePhotos.RemoveRange(db.PlacePhotos.Where(p => p.Id == photoId));
            await db.SaveChangesAsync();
        }
    }
}
