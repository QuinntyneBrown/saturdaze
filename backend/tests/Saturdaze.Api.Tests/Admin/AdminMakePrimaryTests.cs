// Traces to: L2-117
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

/// <summary><c>POST /api/admin/photos/{photoId}/primary</c>: exactly one primary, locked and reviewed (L2-117).</summary>
public class AdminMakePrimaryTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private SignedInClient.Session _admin = null!;

    public AdminMakePrimaryTests(SaturdazeApiFactory factory) => _factory = factory;

    public async Task InitializeAsync() => _admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<(Guid PlaceId, List<PlacePhoto> Photos)> Photos(string activityName)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var place = await db.Activities.SingleAsync(a => a.Name == activityName);
        var photos = await db.PlacePhotos.AsNoTracking()
            .Where(p => p.PlaceKind == PlaceKind.Activity && p.PlaceId == place.Id).ToListAsync();
        return (place.Id, photos);
    }

    [Fact]
    public async Task Making_a_photo_primary_leaves_exactly_one_primary_and_shows_on_the_idea_card()
    {
        // Traces to: L2-117 AC1, L2-100 AC1
        var (placeId, before) = await Photos("Port Credit Memorial Park");
        var side = before.Single(p => p.Url.EndsWith("memorial-park-side.jpg"));
        side.IsPrimary.Should().BeFalse();

        var res = await _admin.Client.PostAsync($"/api/admin/photos/{side.Id}/primary", null);
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var dto = JsonDocument.Parse(body).RootElement;
        dto.GetProperty("id").GetGuid().Should().Be(side.Id);
        dto.GetProperty("isPrimary").GetBoolean().Should().BeTrue();
        dto.GetProperty("adminLocked").GetBoolean().Should().BeTrue();
        dto.GetProperty("reviewState").GetString().Should().Be("Reviewed");
        dto.GetProperty("updatedAt").ValueKind.Should().Be(JsonValueKind.String);
        dto.GetProperty("updatedBy").GetGuid().Should().Be(_admin.UserId);

        var (_, after) = await Photos("Port Credit Memorial Park");
        after.Count(p => p.IsPrimary).Should().Be(1);
        after.Single(p => p.IsPrimary).Id.Should().Be(side.Id);
        after.Single(p => p.Id == side.Id).UpdatedBy.Should().Be(_admin.UserId);

        var family = await SignedInClient.CreateAsync(_factory);
        var feed = await family.Client.GetAsync("/api/activities");
        var card = JsonDocument.Parse(await feed.Content.ReadAsStringAsync()).RootElement.EnumerateArray()
            .Single(a => a.GetProperty("name").GetString() == "Port Credit Memorial Park");
        card.GetProperty("photo").GetProperty("url").GetString().Should().Be("https://images.example.com/memorial-park-side.jpg");
        _ = placeId;
    }

    [Fact]
    public async Task Promoting_an_unreviewed_provider_photo_marks_it_reviewed()
    {
        // Traces to: L2-117
        var (placeId, _) = await Photos("Stratford Festival (family matinee)");
        Guid photoId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var photo = PlacePhoto.Create(PlaceKind.Activity, placeId, "https://images.example.com/stratford.jpg",
                1200, 675, "The stage", "Photo · Provider", PhotoSource.Provider, "Provider terms",
                primary: false, reviewState: PhotoReviewState.Unreviewed)!;
            db.PlacePhotos.Add(photo);
            await db.SaveChangesAsync();
            photoId = photo.Id;
        }

        var res = await _admin.Client.PostAsync($"/api/admin/photos/{photoId}/primary", null);
        res.StatusCode.Should().Be(HttpStatusCode.OK, await res.Content.ReadAsStringAsync());
        var (_, after) = await Photos("Stratford Festival (family matinee)");
        var promoted = after.Single(p => p.Id == photoId);
        promoted.IsPrimary.Should().BeTrue();
        promoted.ReviewState.Should().Be(PhotoReviewState.Reviewed);
        promoted.AdminLocked.Should().BeTrue();
    }

    [Fact]
    public async Task Unknown_photo_is_404_and_non_admins_are_403()
    {
        // Traces to: L2-117 AC4, L2-111 AC2
        var res = await _admin.Client.PostAsync($"/api/admin/photos/{Guid.NewGuid()}/primary", null);
        res.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var (_, photos) = await Photos("Port Credit Memorial Park");
        var user = await SignedInClient.CreateAsync(_factory);
        res = await user.Client.PostAsync($"/api/admin/photos/{photos[0].Id}/primary", null);
        res.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
