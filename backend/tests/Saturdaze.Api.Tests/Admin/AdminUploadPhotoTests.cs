// Traces to: L2-115, L2-121
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;
using SkiaSharp;
using Xunit;

namespace Saturdaze.Api.Tests.Admin;

/// <summary>
/// <c>POST /api/admin/places/{kind}/{id}/photos</c> as multipart: a curated upload is checked by
/// content, cleaned, stored publicly on an allowed origin and becomes primary when it should (L2-115).
/// </summary>
public class AdminUploadPhotoTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private SignedInClient.Session _admin = null!;

    public AdminUploadPhotoTests(SaturdazeApiFactory factory) => _factory = factory;

    public async Task InitializeAsync() => _admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
    public Task DisposeAsync() => Task.CompletedTask;

    private static MultipartFormDataContent Form(byte[] bytes, string fileName, string? alt, string? attribution, string? licence)
    {
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        var form = new MultipartFormDataContent { { file, "file", fileName } };
        if (alt is not null) form.Add(new StringContent(alt), "alt");
        if (attribution is not null) form.Add(new StringContent(attribution), "attribution");
        if (licence is not null) form.Add(new StringContent(licence), "licence");
        return form;
    }

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
        return await db.PlacePhotos.AsNoTracking().Where(p => p.PlaceId == placeId).ToListAsync();
    }

    private int StoredFiles() => Directory.Exists(_factory.CuratedPhotoDirectory) ? Directory.GetFiles(_factory.CuratedPhotoDirectory).Length : 0;

    [Fact]
    public async Task An_upload_to_a_place_without_photos_becomes_primary_without_exif_and_shows_on_the_idea_card()
    {
        // Traces to: L2-115 AC1
        var placeId = await ActivityId("Stratford Festival (family matinee)");
        var original = TestPhotos.JpegWithGps();
        TestPhotos.Contains(original, "Exif"u8.ToArray()).Should().BeTrue("the fixture carries EXIF");

        var res = await _admin.Client.PostAsync($"/api/admin/places/Activity/{placeId}/photos",
            Form(original, "stratford.jpg", "The stage at dusk", "Photo · Saturdaze", "Saturdaze owned"));
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.Created, body);
        var dto = JsonDocument.Parse(body).RootElement;
        dto.GetProperty("isPrimary").GetBoolean().Should().BeTrue();
        dto.GetProperty("source").GetString().Should().Be("Curated");
        dto.GetProperty("reviewState").GetString().Should().Be("Reviewed");
        dto.GetProperty("adminLocked").GetBoolean().Should().BeTrue();
        dto.GetProperty("blocked").GetBoolean().Should().BeFalse("the curated origin is allow-listed");
        dto.GetProperty("width").GetInt32().Should().Be(64);
        dto.GetProperty("height").GetInt32().Should().Be(48);
        var url = dto.GetProperty("url").GetString()!;
        url.Should().StartWith(SaturdazeApiFactory.CuratedPublicOrigin + "/api/catalog-photos/");

        // The stored file is served anonymously, cacheable, and carries no metadata.
        var path = new Uri(url).PathAndQuery;
        var served = await _factory.CreateClient().GetAsync(path);
        served.StatusCode.Should().Be(HttpStatusCode.OK);
        served.Headers.CacheControl!.Public.Should().BeTrue();
        served.Headers.CacheControl.MaxAge.Should().Be(TimeSpan.FromDays(365));
        var bytes = await served.Content.ReadAsByteArrayAsync();
        TestPhotos.Contains(bytes, "Exif"u8.ToArray()).Should().BeFalse("all metadata is stripped");
        SKBitmap.Decode(bytes).Should().NotBeNull();

        var stored = (await PhotosOf(placeId)).Single();
        stored.StorageKey.Should().NotBeNullOrEmpty();
        stored.AltText.Should().Be("The stage at dusk");

        var family = await SignedInClient.CreateAsync(_factory);
        var feed = await family.Client.GetAsync("/api/activities");
        var card = JsonDocument.Parse(await feed.Content.ReadAsStringAsync()).RootElement.EnumerateArray()
            .Single(a => a.GetProperty("name").GetString() == "Stratford Festival (family matinee)");
        card.GetProperty("photo").GetProperty("url").GetString().Should().Be(url);
    }

    [Fact]
    public async Task A_pdf_named_jpg_is_refused_and_nothing_is_stored()
    {
        // Traces to: L2-115 AC2
        var placeId = await ActivityId("Bruce Trail at Rattlesnake Point");
        var before = StoredFiles();
        var pdf = Encoding.ASCII.GetBytes("%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\n%%EOF");
        var res = await _admin.Client.PostAsync($"/api/admin/places/Activity/{placeId}/photos",
            Form(pdf, "photo.jpg", "", "Photo · Saturdaze", "Saturdaze owned"));
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest, body);
        JsonDocument.Parse(body).RootElement.GetProperty("code").GetString().Should().Be("unsupported_image");
        StoredFiles().Should().Be(before);
        (await PhotosOf(placeId)).Should().BeEmpty();
    }

    [Fact]
    public async Task An_eleven_megabyte_file_is_413_and_nothing_is_stored()
    {
        // Traces to: L2-115 AC3
        var placeId = await ActivityId("Bruce Trail at Rattlesnake Point");
        var before = StoredFiles();
        var big = TestPhotos.JpegWithGps().Concat(new byte[11 * 1024 * 1024]).ToArray();
        var res = await _admin.Client.PostAsync($"/api/admin/places/Activity/{placeId}/photos",
            Form(big, "big.jpg", "", "Photo · Saturdaze", "Saturdaze owned"));
        res.StatusCode.Should().Be(HttpStatusCode.RequestEntityTooLarge);
        StoredFiles().Should().Be(before);
        (await PhotosOf(placeId)).Should().BeEmpty();
    }

    [Fact]
    public async Task Empty_attribution_or_licence_is_a_field_error_and_nothing_is_stored()
    {
        // Traces to: L2-115 AC4
        var placeId = await ActivityId("Bruce Trail at Rattlesnake Point");
        var before = StoredFiles();
        var res = await _admin.Client.PostAsync($"/api/admin/places/Activity/{placeId}/photos",
            Form(TestPhotos.Jpeg(), "a.jpg", "", "", "Saturdaze owned"));
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await res.Content.ReadAsStringAsync()).Should().Contain("attribution");

        res = await _admin.Client.PostAsync($"/api/admin/places/Activity/{placeId}/photos",
            Form(TestPhotos.Jpeg(), "a.jpg", "", "Photo · Saturdaze", null));
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await res.Content.ReadAsStringAsync()).Should().Contain("licence");
        StoredFiles().Should().Be(before);
    }

    [Fact]
    public async Task A_curated_upload_replaces_an_unreviewed_provider_primary_but_not_an_administrators_choice()
    {
        // Traces to: L2-115 AC5, AC6, L2-121 AC5
        var placeId = await ActivityId("Riverwood Conservancy");
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.PlacePhotos.Add(PlacePhoto.Create(PlaceKind.Activity, placeId, "https://images.example.com/riverwood-provider.jpg",
                1200, 675, "Trail", "Photo · Provider", PhotoSource.Provider, "Provider terms",
                primary: true, reviewState: PhotoReviewState.Unreviewed)!);
            await db.SaveChangesAsync();
        }

        var first = await _admin.Client.PostAsync($"/api/admin/places/Activity/{placeId}/photos",
            Form(TestPhotos.Jpeg(), "one.jpg", "Boardwalk", "Photo · Saturdaze", "Saturdaze owned"));
        first.StatusCode.Should().Be(HttpStatusCode.Created, await first.Content.ReadAsStringAsync());
        var photos = await PhotosOf(placeId);
        photos.Count(p => p.IsPrimary).Should().Be(1);
        photos.Single(p => p.IsPrimary).Source.Should().Be(PhotoSource.Curated, "curated beats an unreviewed provider photo");

        var second = await _admin.Client.PostAsync($"/api/admin/places/Activity/{placeId}/photos",
            Form(TestPhotos.Jpeg(), "two.jpg", "Pond", "Photo · Saturdaze", "Saturdaze owned"));
        second.StatusCode.Should().Be(HttpStatusCode.Created);
        var after = await PhotosOf(placeId);
        after.Count(p => p.IsPrimary).Should().Be(1);
        after.Single(p => p.IsPrimary).AltText.Should().Be("Boardwalk", "a primary an administrator chose stays");
    }

    [Fact]
    public async Task Uploads_log_the_place_and_size_but_never_the_file_name_and_non_admins_are_403()
    {
        // Traces to: L2-115 AC7, L2-111 AC2
        var placeId = await ActivityId("Terre Bleu Lavender Farm");
        const string fileName = "curators-laptop-export-final.jpg";
        var res = await _admin.Client.PostAsync($"/api/admin/places/Activity/{placeId}/photos",
            Form(TestPhotos.Jpeg(), fileName, "Lavender rows", "Photo · Saturdaze", "Saturdaze owned"));
        res.StatusCode.Should().Be(HttpStatusCode.Created, await res.Content.ReadAsStringAsync());

        var messages = _factory.Logs.Messages;
        messages.Should().Contain(m => m.Contains(placeId.ToString()) && m.Contains("bytes"));
        messages.Should().NotContain(m => m.Contains(fileName));

        var user = await SignedInClient.CreateAsync(_factory);
        res = await user.Client.PostAsync($"/api/admin/places/Activity/{placeId}/photos",
            Form(TestPhotos.Jpeg(), "x.jpg", "", "Photo · Saturdaze", "Saturdaze owned"));
        res.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        res = await _admin.Client.PostAsync($"/api/admin/places/Activity/{Guid.NewGuid()}/photos",
            Form(TestPhotos.Jpeg(), "x.jpg", "", "Photo · Saturdaze", "Saturdaze owned"));
        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
