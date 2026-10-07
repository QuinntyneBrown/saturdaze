// Traces to: L2-114
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

/// <summary><c>GET /api/admin/places/{kind}/{id}/photos</c>: every photo of a place, its review state and the cover impact (L2-114).</summary>
public class AdminPlacePhotosTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private HttpClient _admin = null!;

    public AdminPlacePhotosTests(SaturdazeApiFactory factory) => _factory = factory;

    public async Task InitializeAsync() => _admin = (await SignedInClient.CreateAsync(_factory, role: UserRole.Admin)).Client;
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<Guid> ActivityId(string name)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return (await db.Activities.SingleAsync(a => a.Name == name)).Id;
    }

    private async Task<JsonElement> Get(PlaceKind kind, Guid id)
    {
        var res = await _admin.GetAsync($"/api/admin/places/{kind}/{id}/photos");
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        return JsonDocument.Parse(body).RootElement;
    }

    [Fact]
    public async Task Lists_every_photo_of_the_place_with_exactly_one_primary()
    {
        // Traces to: L2-114 AC1
        var dto = await Get(PlaceKind.Activity, await ActivityId("Port Credit Memorial Park"));
        dto.GetProperty("name").GetString().Should().Be("Port Credit Memorial Park");
        dto.GetProperty("kind").GetString().Should().Be("Activity");
        var photos = dto.GetProperty("photos").EnumerateArray().ToList();
        photos.Should().HaveCount(2);
        photos.Count(p => p.GetProperty("isPrimary").GetBoolean()).Should().Be(1);

        var primary = photos.Single(p => p.GetProperty("isPrimary").GetBoolean());
        primary.GetProperty("url").GetString().Should().Be("https://images.example.com/memorial-park.jpg");
        primary.GetProperty("width").GetInt32().Should().Be(1200);
        primary.GetProperty("alt").GetString().Should().Be("Lawn running down to the lake");
        primary.GetProperty("attribution").GetString().Should().Be("Photo · Jo Doe");
        primary.GetProperty("license").GetString().Should().Be("CC BY 4.0");
        primary.GetProperty("source").GetString().Should().Be("Curated");
        primary.GetProperty("reviewState").GetString().Should().Be("Reviewed");
        primary.GetProperty("adminLocked").GetBoolean().Should().BeFalse();
        primary.GetProperty("blocked").GetBoolean().Should().BeFalse();
        primary.GetProperty("updatedAt").ValueKind.Should().Be(JsonValueKind.Null);
        // Primary first, then the rest by URL so the tiles have a stable order.
        photos[0].GetProperty("isPrimary").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task A_photo_outside_the_allow_list_is_marked_blocked()
    {
        // Traces to: L2-114 AC2
        var dto = await Get(PlaceKind.Activity, await ActivityId("Rec Room Mississauga"));
        var photo = dto.GetProperty("photos").EnumerateArray().Single();
        photo.GetProperty("blocked").GetBoolean().Should().BeTrue();
        photo.GetProperty("url").GetString().Should().Be("http://images.example.com/rec-room.jpg");
    }

    [Fact]
    public async Task Cover_impact_counts_weekends_whose_cover_follows_the_place_without_naming_them()
    {
        // Traces to: L2-114 AC3
        var placeId = await ActivityId("Jack Darling Memorial Park");
        var weekendIds = await AddWeekendsWithCoverAsync(placeId, 3);
        try
        {
            var dto = await Get(PlaceKind.Activity, placeId);
            dto.GetProperty("coverImpact").GetInt32().Should().Be(3);
            var body = dto.GetRawText();
            foreach (var id in weekendIds) body.Should().NotContain(id.ToString());
            body.Should().NotContain("familyId", "admin endpoints never expose family identifiers");

            (await Get(PlaceKind.Activity, await ActivityId("Toronto Zoo"))).GetProperty("coverImpact").GetInt32().Should().Be(0);
        }
        finally
        {
            await RemoveWeekendsAsync(weekendIds);
        }
    }

    [Fact]
    public async Task A_place_without_photos_lists_none_and_an_unknown_place_is_404()
    {
        // Traces to: L2-114 AC4
        var dto = await Get(PlaceKind.Activity, await ActivityId("Stratford Festival (family matinee)"));
        dto.GetProperty("photos").GetArrayLength().Should().Be(0);
        dto.GetProperty("coverImpact").GetInt32().Should().Be(0);

        var res = await _admin.GetAsync($"/api/admin/places/Activity/{Guid.NewGuid()}/photos");
        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
        res = await _admin.GetAsync($"/api/admin/places/Castle/{Guid.NewGuid()}/photos");
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private async Task<List<Guid>> AddWeekendsWithCoverAsync(Guid placeId, int count)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var family = await db.Families.FirstAsync();
        var ids = new List<Guid>();
        for (var i = 0; i < count; i++)
        {
            var weekend = new Weekend
            {
                Id = Guid.NewGuid(),
                FamilyId = family.Id,
                WeekendOf = new DateOnly(2030, 1, 5).AddDays(7 * i),
                CoverSource = CoverSource.Stop,
                CoverPlaceKind = PlaceKind.Activity,
                CoverPlaceId = placeId,
            };
            db.Weekends.Add(weekend);
            ids.Add(weekend.Id);
        }
        await db.SaveChangesAsync();
        return ids;
    }

    private async Task RemoveWeekendsAsync(List<Guid> ids)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Weekends.Where(w => ids.Contains(w.Id)).ExecuteDeleteAsync();
    }
}
