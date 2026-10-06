// Traces to: L2-118
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Admin;

/// <summary><c>PATCH /api/admin/photos/{photoId}</c>: alt, attribution and licence; the URL stays (L2-118).</summary>
public class AdminEditPhotoTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private SignedInClient.Session _admin = null!;

    public AdminEditPhotoTests(SaturdazeApiFactory factory) => _factory = factory;

    public async Task InitializeAsync() => _admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
    public Task DisposeAsync() => Task.CompletedTask;

    private record EditRequest(string? Alt, string? Attribution, string? Licence, string? Url = null);

    private async Task<Guid> PhotoId(string urlEnding)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return (await db.PlacePhotos.AsNoTracking().SingleAsync(p => p.Url.EndsWith(urlEnding))).Id;
    }

    [Fact]
    public async Task Editing_updates_the_three_fields_and_locks_the_photo()
    {
        // Traces to: L2-118 AC1
        var id = await PhotoId("memorial-park-side.jpg");
        var res = await _admin.Client.PatchAsJsonAsync($"/api/admin/photos/{id}",
            new EditRequest("Lawn down to the lake", "Photo · Jo Doe", "CC BY-SA 4.0"));
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var dto = JsonDocument.Parse(body).RootElement;
        dto.GetProperty("alt").GetString().Should().Be("Lawn down to the lake");
        dto.GetProperty("attribution").GetString().Should().Be("Photo · Jo Doe");
        dto.GetProperty("license").GetString().Should().Be("CC BY-SA 4.0");
        dto.GetProperty("adminLocked").GetBoolean().Should().BeTrue();
        dto.GetProperty("isPrimary").GetBoolean().Should().BeFalse("editing details never changes the primary");
        dto.GetProperty("updatedBy").GetGuid().Should().Be(_admin.UserId);
    }

    [Fact]
    public async Task Empty_attribution_or_licence_is_a_field_error()
    {
        // Traces to: L2-118 AC2
        var id = await PhotoId("memorial-park.jpg");
        var res = await _admin.Client.PatchAsJsonAsync($"/api/admin/photos/{id}", new EditRequest("Alt", "", "CC BY 4.0"));
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await res.Content.ReadAsStringAsync()).Should().Contain("attribution");

        res = await _admin.Client.PatchAsJsonAsync($"/api/admin/photos/{id}", new EditRequest("Alt", "Photo · Jo Doe", "  "));
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await res.Content.ReadAsStringAsync()).Should().Contain("licence");
    }

    [Fact]
    public async Task The_url_is_immutable_and_empty_alt_flags_the_place()
    {
        // Traces to: L2-118 AC3, AC4
        var id = await PhotoId("snug-harbour.jpg");
        var res = await _admin.Client.PatchAsJsonAsync($"/api/admin/photos/{id}",
            new EditRequest("", "Photo · Jo Doe", "CC BY 4.0", Url: "https://images.example.com/other.jpg"));
        res.StatusCode.Should().Be(HttpStatusCode.OK, await res.Content.ReadAsStringAsync());

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var photo = await db.PlacePhotos.AsNoTracking().SingleAsync(p => p.Id == id);
            photo.Url.Should().Be("https://images.example.com/snug-harbour.jpg");
            photo.AltText.Should().BeEmpty();
        }

        var list = await _admin.Client.GetAsync("/api/admin/places?q=snug");
        var item = JsonDocument.Parse(await list.Content.ReadAsStringAsync()).RootElement.GetProperty("items").EnumerateArray().Single();
        item.GetProperty("flags").EnumerateArray().Select(f => f.GetString()).Should().Contain("missing-alt");

        var family = await SignedInClient.CreateAsync(_factory);
        var feed = await family.Client.GetAsync("/api/restaurants?day=2026-05-16&slot=Dinner&wifeApprovedOnly=false");
        var card = JsonDocument.Parse(await feed.Content.ReadAsStringAsync()).RootElement.EnumerateArray()
            .Single(r => r.GetProperty("name").GetString() == "Snug Harbour");
        card.GetProperty("photo").GetProperty("alt").GetString().Should().Be("Photo of Snug Harbour");
    }

    [Fact]
    public async Task Unknown_photo_is_404()
    {
        var res = await _admin.Client.PatchAsJsonAsync($"/api/admin/photos/{Guid.NewGuid()}", new EditRequest("a", "b", "c"));
        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
