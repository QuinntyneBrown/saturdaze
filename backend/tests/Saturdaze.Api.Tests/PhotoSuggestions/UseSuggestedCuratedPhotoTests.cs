// Traces to: L2-159
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

namespace Saturdaze.Api.Tests.PhotoSuggestions;

/// <summary><c>POST /api/admin/places/{kind}/{id}/photos/suggestion</c>: a suggestion joins the curated store like an upload (L2-159).</summary>
public class UseSuggestedCuratedPhotoTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private SignedInClient.Session _admin = null!;

    public UseSuggestedCuratedPhotoTests(SaturdazeApiFactory factory) => _factory = factory;

    public async Task InitializeAsync() => _admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<Guid> ActivityId(string name)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return (await db.Activities.SingleAsync(a => a.Name == name)).Id;
    }

    private Task<HttpResponseMessage> Use(Guid placeId, string suggestionId, string attribution = "Photo · City of Mississauga", string licence = "CC BY 4.0", string alt = "Lawn running down to the lake") =>
        _admin.Client.PostAsJsonAsync($"/api/admin/places/Activity/{placeId}/photos/suggestion",
            new { suggestionId, alt, attribution, licence });

    private static async Task<JsonElement> Body(HttpResponseMessage res) =>
        JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement;

    [Fact]
    public async Task A_suggestion_is_stored_as_a_curated_upload_and_becomes_primary()
    {
        // Traces to: L2-159 AC1, AC4
        var placeId = await ActivityId("Stratford Festival (family matinee)");
        const string sourceUrl = "https://commons.wikimedia.org/wiki/File:Stratford.jpg";
        var seeded = await PhotoSuggestionSeeder.SuggestAsync(_factory, _admin.Client, TestPhotos.JpegWithGps(), sourceUrl: sourceUrl);

        var res = await Use(placeId, seeded.Id);
        var dto = await Body(res);
        res.StatusCode.Should().Be(HttpStatusCode.Created, dto.ToString());
        dto.GetProperty("source").GetString().Should().Be("Curated");
        dto.GetProperty("reviewState").GetString().Should().Be("Reviewed");
        dto.GetProperty("adminLocked").GetBoolean().Should().BeTrue();
        dto.GetProperty("isPrimary").GetBoolean().Should().BeTrue("the place had no photo");
        dto.GetProperty("attribution").GetString().Should().Be("Photo · City of Mississauga");
        dto.GetProperty("license").GetString().Should().Be("CC BY 4.0");
        var url = dto.GetProperty("url").GetString()!;
        url.Should().StartWith(SaturdazeApiFactory.CuratedPublicOrigin + "/api/catalog-photos/");

        var served = await _factory.CreateClient().GetAsync(new Uri(url).PathAndQuery);
        served.StatusCode.Should().Be(HttpStatusCode.OK);
        served.Content.Headers.ContentType!.MediaType.Should().Be("image/jpeg");
        TestPhotos.Contains(await served.Content.ReadAsByteArrayAsync(), "Exif\0\0"u8.ToArray()).Should().BeFalse();

        var feed = JsonDocument.Parse(await _admin.Client.GetStringAsync("/api/activities")).RootElement;
        var card = feed.EnumerateArray().Single(a => a.GetProperty("id").GetGuid() == placeId);
        card.GetProperty("photo").GetProperty("url").GetString().Should().Be(url);

        var audit = JsonDocument.Parse(await _admin.Client.GetStringAsync($"/api/admin/photo-audit?kind=Activity&placeId={placeId}")).RootElement;
        var newest = audit.GetProperty("items")[0];
        newest.GetProperty("action").GetString().Should().Be("upload");
        newest.GetProperty("after").GetString().Should().Contain(sourceUrl);
    }

    [Fact]
    public async Task Missing_fields_and_unknown_suggestions_are_refused_and_nothing_is_stored()
    {
        // Traces to: L2-159 AC2
        var placeId = await ActivityId("Riverwood Conservancy");
        var seeded = await PhotoSuggestionSeeder.SuggestAsync(_factory, _admin.Client, TestPhotos.Jpeg());

        var res = await Use(placeId, seeded.Id, attribution: "");
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await res.Content.ReadAsStringAsync()).Should().Contain("attribution");

        res = await Use(placeId, seeded.Id, licence: "");
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await res.Content.ReadAsStringAsync()).Should().Contain("licence");

        res = await Use(placeId, Guid.NewGuid().ToString("N"));
        var body = await Body(res);
        res.StatusCode.Should().Be(HttpStatusCode.NotFound, body.ToString());
        body.GetProperty("code").GetString().Should().Be("suggestion_not_found");

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.PlacePhotos.CountAsync(p => p.PlaceId == placeId)).Should().Be(0);
    }

    [Fact]
    public async Task A_family_member_cannot_add_a_curated_photo()
    {
        // Traces to: L2-159 AC3
        var placeId = await ActivityId("Riverwood Conservancy");
        var family = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var seeded = await PhotoSuggestionSeeder.SuggestAsync(_factory, family.Client, TestPhotos.Jpeg());

        var res = await family.Client.PostAsJsonAsync($"/api/admin/places/Activity/{placeId}/photos/suggestion",
            new { suggestionId = seeded.Id, alt = "", attribution = "Photo · X", licence = "CC0" });
        res.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
