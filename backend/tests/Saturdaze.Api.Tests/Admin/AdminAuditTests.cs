// Traces to: L2-122, L2-120 AC5
using System.Net;
using System.Net.Http.Headers;
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
/// <c>GET /api/admin/photo-audit</c> (L2-122): every admin photo change writes an entry with
/// who, when, the place, the action and the before/after values; and
/// <c>GET /api/admin/ingestion-runs/photo-skips</c> (L2-120 AC5): each run's photo skips, linked
/// to the place when it still exists.
/// </summary>
public class AdminAuditTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private SignedInClient.Session _admin = null!;

    public AdminAuditTests(SaturdazeApiFactory factory) => _factory = factory;

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

    private async Task<JsonElement> Audit(string query = "")
    {
        var res = await _admin.Client.GetAsync("/api/admin/photo-audit" + query);
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        return JsonDocument.Parse(body).RootElement;
    }

    private static List<JsonElement> Items(JsonElement page) => page.GetProperty("items").EnumerateArray().ToList();

    [Fact]
    public async Task Making_a_photo_primary_is_audited_with_the_previous_and_new_primary()
    {
        // Traces to: L2-122 AC1, AC4
        var (placeId, before) = await Photos("Port Credit Memorial Park");
        var previous = before.Single(p => p.IsPrimary);
        var side = before.Single(p => !p.IsPrimary);

        var res = await _admin.Client.PostAsync($"/api/admin/photos/{side.Id}/primary", null);
        res.StatusCode.Should().Be(HttpStatusCode.OK);

        var page = await Audit($"?kind=Activity&placeId={placeId}");
        var entry = Items(page).First();
        entry.GetProperty("adminEmail").GetString().Should().Be(_admin.Email);
        entry.GetProperty("adminId").GetGuid().Should().Be(_admin.UserId);
        entry.GetProperty("occurredAt").GetDateTimeOffset().Offset.Should().Be(TimeSpan.Zero, "the log is in UTC");
        entry.GetProperty("kind").GetString().Should().Be("Activity");
        entry.GetProperty("placeId").GetGuid().Should().Be(placeId);
        entry.GetProperty("placeName").GetString().Should().Be("Port Credit Memorial Park");
        entry.GetProperty("photoId").GetGuid().Should().Be(side.Id);
        entry.GetProperty("action").GetString().Should().Be("primary");
        entry.GetProperty("before").GetString().Should().Contain(previous.Id.ToString());
        entry.GetProperty("after").GetString().Should().Contain(side.Id.ToString());
    }

    [Fact]
    public async Task Every_change_is_logged_and_the_list_filters_by_administrator()
    {
        // Traces to: L2-122 AC2, AC3
        var (placeId, photos) = await Photos("Jack Darling Memorial Park");
        var photo = photos.Single();
        var other = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);

        // Edit (admin), upload (other admin), remove (other admin), review (admin).
        (await _admin.Client.PatchAsJsonAsync($"/api/admin/photos/{photo.Id}",
            new { alt = "Beach volleyball courts", attribution = "Photo · Jo Doe", licence = "CC BY 4.0" }))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        using var form = new MultipartFormDataContent();
        var file = new ByteArrayContent(TestPhotos.Jpeg());
        file.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        form.Add(file, "file", "secret-file-name.jpg");
        form.Add(new StringContent("Beach"), "alt");
        form.Add(new StringContent("Photo · Saturdaze"), "attribution");
        form.Add(new StringContent("CC0"), "licence");
        var uploaded = await other.Client.PostAsync($"/api/admin/places/Activity/{placeId}/photos", form);
        uploaded.StatusCode.Should().Be(HttpStatusCode.Created, await uploaded.Content.ReadAsStringAsync());
        var uploadedId = JsonDocument.Parse(await uploaded.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid();

        (await other.Client.DeleteAsync($"/api/admin/photos/{uploadedId}?nextPrimaryId={photo.Id}"))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        var all = Items(await Audit($"?kind=Activity&placeId={placeId}"));
        all.Select(e => e.GetProperty("action").GetString()).Should().StartWith(new[] { "remove", "upload", "edit" }, "newest first");

        var upload = all.Single(e => e.GetProperty("action").GetString() == "upload");
        upload.GetProperty("after").GetString().Should().Contain("bytes").And.NotContain("secret-file-name");
        var edit = all.Single(e => e.GetProperty("action").GetString() == "edit");
        edit.GetProperty("before").GetString().Should().Contain("\"alt\":\"\"");
        edit.GetProperty("after").GetString().Should().Contain("Beach volleyball courts");

        var mine = Items(await Audit($"?adminId={_admin.UserId}&kind=Activity&placeId={placeId}"));
        mine.Should().OnlyContain(e => e.GetProperty("adminId").GetGuid() == _admin.UserId);
        mine.Select(e => e.GetProperty("action").GetString()).Should().Contain("edit").And.NotContain("upload");
        var theirs = Items(await Audit($"?adminId={other.UserId}"));
        theirs.Select(e => e.GetProperty("action").GetString()).Should().BeEquivalentTo("upload", "remove");
    }

    [Fact]
    public async Task Ingestion_photo_skips_list_each_run_and_link_the_place_when_it_exists()
    {
        // Traces to: L2-120 AC5
        Guid runId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var run = new IngestionRun
            {
                Id = Guid.NewGuid(),
                StartedUtc = new DateTimeOffset(2026, 10, 6, 4, 12, 0, TimeSpan.Zero),
                FinishedUtc = new DateTimeOffset(2026, 10, 6, 4, 13, 0, TimeSpan.Zero),
                Type = IngestionType.Restaurants,
                Status = IngestionStatus.Succeeded,
                SkipReasons = "Snug Harbour: photo https://images.example.com/snug-2.jpg skipped, previously rejected\n"
                    + "Lakeside Climbing Gym: photo https://photos.example.net/climb.jpg skipped, missing attribution or licence",
            };
            db.IngestionRuns.Add(run);
            db.IngestionRuns.Add(new IngestionRun
            {
                Id = Guid.NewGuid(), StartedUtc = run.StartedUtc.AddDays(-1), Type = IngestionType.Events, Status = IngestionStatus.Succeeded,
            });
            await db.SaveChangesAsync();
            runId = run.Id;
        }

        var res = await _admin.Client.GetAsync("/api/admin/ingestion-runs/photo-skips");
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var runs = JsonDocument.Parse(body).RootElement.EnumerateArray().ToList();
        runs.Should().ContainSingle(r => r.GetProperty("runId").GetGuid() == runId, "runs without skips are left out");
        var dto = runs.Single(r => r.GetProperty("runId").GetGuid() == runId);
        dto.GetProperty("type").GetString().Should().Be("Restaurants");
        dto.GetProperty("status").GetString().Should().Be("Succeeded");
        dto.GetProperty("startedUtc").GetDateTimeOffset().Should().Be(new DateTimeOffset(2026, 10, 6, 4, 12, 0, TimeSpan.Zero));

        var skips = dto.GetProperty("skips").EnumerateArray().ToList();
        skips.Should().HaveCount(2);
        skips[0].GetProperty("placeName").GetString().Should().Be("Snug Harbour");
        skips[0].GetProperty("reason").GetString().Should().Be("previously rejected");
        skips[0].GetProperty("url").GetString().Should().Be("https://images.example.com/snug-2.jpg");
        skips[0].GetProperty("kind").GetString().Should().Be("Restaurant");
        skips[0].GetProperty("placeId").ValueKind.Should().Be(JsonValueKind.String);
        skips[1].GetProperty("placeName").GetString().Should().Be("Lakeside Climbing Gym");
        skips[1].GetProperty("placeId").ValueKind.Should().Be(JsonValueKind.Null, "the place is not in the catalog");
    }
}
