// Traces to: L2-120
using System.Net;
using System.Net.Http.Json;
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
/// <c>GET /api/admin/photo-reviews</c> and <c>POST /api/admin/photos/{id}/review</c> (L2-120):
/// an unreviewed provider photo waits in the queue until it is kept, promoted or rejected.
/// Each test adds the provider photo it needs and removes what it leaves behind.
/// </summary>
public class PhotoReviewTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private SignedInClient.Session _admin = null!;

    public PhotoReviewTests(SaturdazeApiFactory factory) => _factory = factory;

    public async Task InitializeAsync() => _admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
    public Task DisposeAsync() => Task.CompletedTask;

    private AppDbContext Db(IServiceScope scope) => scope.ServiceProvider.GetRequiredService<AppDbContext>();

    private async Task<(Guid PlaceId, Guid PhotoId)> AddProviderPhotoAsync(string restaurantName, string url, bool primary)
    {
        using var scope = _factory.Services.CreateScope();
        var db = Db(scope);
        var place = await db.Restaurants.SingleAsync(r => r.Name == restaurantName);
        var photo = PlacePhoto.Create(PlaceKind.Restaurant, place.Id, url, 1200, 675, "Dining room",
            "Photo · Provider", PhotoSource.Provider, "Provider terms", primary, PhotoReviewState.Unreviewed)!;
        db.PlacePhotos.Add(photo);
        await db.SaveChangesAsync();
        return (place.Id, photo.Id);
    }

    private async Task CleanUpAsync(Guid placeId, string url)
    {
        using var scope = _factory.Services.CreateScope();
        var db = Db(scope);
        db.PlacePhotos.RemoveRange(db.PlacePhotos.Where(p => p.PlaceId == placeId && p.Url == url));
        db.RejectedPlacePhotos.RemoveRange(db.RejectedPlacePhotos.Where(r => r.PlaceId == placeId));
        await db.SaveChangesAsync();
    }

    private async Task<List<JsonElement>> Queue()
    {
        var res = await _admin.Client.GetAsync("/api/admin/photo-reviews");
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        return JsonDocument.Parse(body).RootElement.EnumerateArray().ToList();
    }

    private static JsonElement? Item(List<JsonElement> queue, Guid photoId)
    {
        var hit = queue.Where(i => i.GetProperty("photo").GetProperty("id").GetGuid() == photoId).ToList();
        return hit.Count == 0 ? null : hit.Single();
    }

    private Task<HttpResponseMessage> Review(Guid photoId, string decision, string? reason = null)
        => _admin.Client.PostAsJsonAsync($"/api/admin/photos/{photoId}/review", new { decision, reason });

    private async Task<PlacePhoto?> PhotoAsync(Guid id)
    {
        using var scope = _factory.Services.CreateScope();
        return await Db(scope).PlacePhotos.AsNoTracking().SingleOrDefaultAsync(p => p.Id == id);
    }

    [Fact]
    public async Task A_provider_photo_waits_in_the_queue_until_it_is_kept()
    {
        // Traces to: L2-120 AC1, AC2
        const string url = "https://images.example.com/spice-lounge-room.jpg";
        var (placeId, photoId) = await AddProviderPhotoAsync("Spice Lounge", url, primary: true);
        try
        {
            var item = Item(await Queue(), photoId);
            item.Should().NotBeNull();
            item!.Value.GetProperty("placeName").GetString().Should().Be("Spice Lounge");
            item.Value.GetProperty("kind").GetString().Should().Be("Restaurant");
            item.Value.GetProperty("placeId").GetGuid().Should().Be(placeId);
            item.Value.GetProperty("replaces").ValueKind.Should().Be(JsonValueKind.Null, "the place had no primary before");

            var res = await Review(photoId, "keep");
            res.StatusCode.Should().Be(HttpStatusCode.NoContent, await res.Content.ReadAsStringAsync());

            Item(await Queue(), photoId).Should().BeNull();
            var photo = await PhotoAsync(photoId);
            photo!.ReviewState.Should().Be(PhotoReviewState.Reviewed);
            photo.AdminLocked.Should().BeTrue();
            photo.UpdatedBy.Should().Be(_admin.UserId);

            res = await Review(photoId, "keep");
            res.StatusCode.Should().Be(HttpStatusCode.Conflict, "a decided photo cannot be reviewed again");
            (await res.Content.ReadAsStringAsync()).Should().Contain("already_reviewed");
        }
        finally
        {
            await CleanUpAsync(placeId, url);
        }
    }

    [Fact]
    public async Task Promoting_from_the_queue_makes_it_the_only_primary()
    {
        // Traces to: L2-120 AC2
        const string url = "https://images.example.com/snug-harbour-provider.jpg";
        var (placeId, photoId) = await AddProviderPhotoAsync("Snug Harbour", url, primary: false);
        try
        {
            var item = Item(await Queue(), photoId)!.Value;
            item.GetProperty("replaces").GetProperty("url").GetString()
                .Should().Be("https://images.example.com/snug-harbour.jpg", "the queue shows the photo it would replace");

            var res = await Review(photoId, "primary");
            res.StatusCode.Should().Be(HttpStatusCode.NoContent, await res.Content.ReadAsStringAsync());

            using var scope = _factory.Services.CreateScope();
            var photos = await Db(scope).PlacePhotos.AsNoTracking().Where(p => p.PlaceId == placeId).ToListAsync();
            photos.Count(p => p.IsPrimary).Should().Be(1);
            photos.Single(p => p.IsPrimary).Id.Should().Be(photoId);
            photos.Single(p => p.Id == photoId).ReviewState.Should().Be(PhotoReviewState.Reviewed);
        }
        finally
        {
            using var scope = _factory.Services.CreateScope();
            var db = Db(scope);
            // Give the curated photo its primary back before dropping the provider one.
            var photos = await db.PlacePhotos.Where(p => p.PlaceId == placeId).ToListAsync();
            foreach (var p in photos) p.IsPrimary = false;
            await db.SaveChangesAsync();
            db.PlacePhotos.RemoveRange(photos.Where(p => p.Url == url));
            photos.Single(p => p.Url.EndsWith("snug-harbour.jpg")).IsPrimary = true;
            await db.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task Rejecting_deletes_the_photo_and_remembers_its_address()
    {
        // Traces to: L2-120 AC3
        const string url = "https://images.example.com/brogue-inn-wrong.jpg";
        var (placeId, photoId) = await AddProviderPhotoAsync("Brogue Inn", url, primary: true);
        try
        {
            var res = await Review(photoId, "reject", "Wrong venue");
            res.StatusCode.Should().Be(HttpStatusCode.NoContent, await res.Content.ReadAsStringAsync());

            (await PhotoAsync(photoId)).Should().BeNull();
            Item(await Queue(), photoId).Should().BeNull();

            using var scope = _factory.Services.CreateScope();
            var rejected = await Db(scope).RejectedPlacePhotos.AsNoTracking().SingleAsync(r => r.PlaceId == placeId && r.Url == url);
            rejected.PlaceKind.Should().Be(PlaceKind.Restaurant);
            rejected.Reason.Should().Be("Wrong venue");
            rejected.RejectedBy.Should().Be(_admin.UserId);
        }
        finally
        {
            await CleanUpAsync(placeId, url);
        }
    }

    [Fact]
    public async Task Unknown_photos_and_decisions_are_refused()
    {
        var res = await Review(Guid.NewGuid(), "keep");
        res.StatusCode.Should().Be(HttpStatusCode.NotFound);

        const string url = "https://images.example.com/sukhothai-room.jpg";
        var (placeId, photoId) = await AddProviderPhotoAsync("Sukhothai", url, primary: true);
        try
        {
            res = await Review(photoId, "maybe");
            res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            (await PhotoAsync(photoId))!.ReviewState.Should().Be(PhotoReviewState.Unreviewed);
        }
        finally
        {
            await CleanUpAsync(placeId, url);
        }
    }
}
