// Traces to: L2-119
using System.Net;
using System.Net.Http.Headers;
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

/// <summary><c>DELETE /api/admin/photos/{photoId}?nextPrimaryId=</c>: the row goes, a curated file goes, at most one primary stays (L2-119).</summary>
public class AdminRemovePhotoTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private SignedInClient.Session _admin = null!;

    public AdminRemovePhotoTests(SaturdazeApiFactory factory) => _factory = factory;

    public async Task InitializeAsync() => _admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<Guid> ActivityId(string name)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return (await db.Activities.SingleAsync(a => a.Name == name)).Id;
    }

    private async Task<List<PlacePhoto>> PhotosOf(Guid placeId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await db.PlacePhotos.AsNoTracking().Where(p => p.PlaceId == placeId).OrderBy(p => p.Url).ToListAsync();
    }

    private static async Task<string?> Code(HttpResponseMessage res)
    {
        var body = JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement;
        return body.TryGetProperty("code", out var code) ? code.GetString() : null;
    }

    [Fact]
    public async Task Removing_the_primary_needs_a_next_primary_and_leaves_at_most_one()
    {
        // Traces to: L2-119 AC1, AC2
        var placeId = await ActivityId("Port Credit Memorial Park");
        var photos = await PhotosOf(placeId);
        var primary = photos.Single(p => p.IsPrimary);
        var other = photos.Single(p => !p.IsPrimary);

        var res = await _admin.Client.DeleteAsync($"/api/admin/photos/{primary.Id}");
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await Code(res)).Should().Be("next_primary_required");
        (await PhotosOf(placeId)).Should().HaveCount(2, "nothing changes when the next primary is missing");

        res = await _admin.Client.DeleteAsync($"/api/admin/photos/{primary.Id}?nextPrimaryId={other.Id}");
        res.StatusCode.Should().Be(HttpStatusCode.NoContent, await res.Content.ReadAsStringAsync());
        var after = await PhotosOf(placeId);
        after.Should().ContainSingle();
        after.Single().Id.Should().Be(other.Id);
        after.Single().IsPrimary.Should().BeTrue();
        after.Single().AdminLocked.Should().BeTrue("the administrator chose the next primary");
    }

    [Fact]
    public async Task Removing_the_primary_can_leave_the_place_without_a_photo()
    {
        // Traces to: L2-119 AC1
        var placeId = await ActivityId("Jack Darling Memorial Park");
        var primary = (await PhotosOf(placeId)).Single(p => p.IsPrimary);

        var res = await _admin.Client.DeleteAsync($"/api/admin/photos/{primary.Id}?nextPrimaryId=none");
        res.StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await PhotosOf(placeId)).Should().BeEmpty();

        var family = await SignedInClient.CreateAsync(_factory);
        var feed = await family.Client.GetAsync("/api/activities");
        var card = JsonDocument.Parse(await feed.Content.ReadAsStringAsync()).RootElement.EnumerateArray()
            .Single(a => a.GetProperty("name").GetString() == "Jack Darling Memorial Park");
        card.GetProperty("photo").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task Removing_a_curated_upload_deletes_its_stored_file()
    {
        // Traces to: L2-119 AC2 (file), AC4 (a non-primary removal keeps the primary)
        var placeId = await RestaurantId("Snug Harbour");
        var file = new ByteArrayContent(TestPhotos.Jpeg());
        file.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        var form = new MultipartFormDataContent { { file, "file", "a.jpg" }, { new StringContent("Patio"), "alt" },
            { new StringContent("Photo · Saturdaze"), "attribution" }, { new StringContent("Saturdaze owned"), "licence" } };
        var created = await _admin.Client.PostAsync($"/api/admin/places/Restaurant/{placeId}/photos", form);
        created.StatusCode.Should().Be(HttpStatusCode.Created, await created.Content.ReadAsStringAsync());
        var dto = JsonDocument.Parse(await created.Content.ReadAsStringAsync()).RootElement;
        var photoId = dto.GetProperty("id").GetGuid();
        dto.GetProperty("isPrimary").GetBoolean().Should().BeFalse("Snug Harbour already has a curated primary");
        var path = new Uri(dto.GetProperty("url").GetString()!).PathAndQuery;
        (await _factory.CreateClient().GetAsync(path)).StatusCode.Should().Be(HttpStatusCode.OK);

        var res = await _admin.Client.DeleteAsync($"/api/admin/photos/{photoId}");
        res.StatusCode.Should().Be(HttpStatusCode.NoContent, "a non-primary photo needs no next primary");
        (await _factory.CreateClient().GetAsync(path)).StatusCode.Should().Be(HttpStatusCode.NotFound, "the stored file is gone");
        var after = await PhotosOf(placeId);
        after.Should().ContainSingle();
        after.Single().IsPrimary.Should().BeTrue();
        after.Single().Url.Should().EndWith("snug-harbour.jpg");
    }

    [Fact]
    public async Task A_next_primary_from_another_place_is_refused_and_unknown_photos_are_404()
    {
        // Traces to: L2-119 AC5
        var memorial = await ActivityId("Port Credit Memorial Park");
        var zoo = await ActivityId("Toronto Zoo");
        var zooPrimary = (await PhotosOf(zoo)).Single();
        var memorialPhoto = (await PhotosOf(memorial)).First();

        var res = await _admin.Client.DeleteAsync($"/api/admin/photos/{zooPrimary.Id}?nextPrimaryId={memorialPhoto.Id}");
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await Code(res)).Should().Be("next_primary_invalid");
        (await PhotosOf(zoo)).Should().ContainSingle();

        (await _admin.Client.DeleteAsync($"/api/admin/photos/{Guid.NewGuid()}")).StatusCode.Should().Be(HttpStatusCode.NotFound);

        var user = await SignedInClient.CreateAsync(_factory);
        (await user.Client.DeleteAsync($"/api/admin/photos/{zooPrimary.Id}?nextPrimaryId=none")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private async Task<Guid> RestaurantId(string name)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return (await db.Restaurants.SingleAsync(r => r.Name == name)).Id;
    }
}
