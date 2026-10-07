// Traces to: L2-121
using System.Text;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Cli.Seed;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Cli.Tests;

/// <summary>Re-seeding never undoes what an administrator decided (L2-121 AC3, AC4); everything else stays idempotent.</summary>
public class SeedPhotosTests
{
    private readonly ActivitySeeder _sut = new();

    private const string Park = """
        [ { "name": "Memorial Park", "driveMinutes": 5, "photos": [
            { "url": "https://images.example.com/a.jpg", "width": 1200, "height": 675, "alt": "Seed alt A", "attribution": "Photo · Seed", "license": "CC BY 4.0", "primary": true },
            { "url": "https://images.example.com/b.jpg", "width": 1200, "height": 675, "alt": "Seed alt B", "attribution": "Photo · Seed", "license": "CC BY 4.0" }
        ] } ]
        """;

    [Fact]
    public async Task Re_seeding_keeps_the_primary_an_administrator_chose()
    {
        // Traces to: L2-121 AC3
        using var db = TestDb.Create();
        await _sut.SeedAsync(db, AsStream(Park), default);
        await db.SaveChangesAsync();

        var b = await db.PlacePhotos.SingleAsync(p => p.Url.EndsWith("b.jpg"));
        var a = await db.PlacePhotos.SingleAsync(p => p.Url.EndsWith("a.jpg"));
        a.IsPrimary = false;
        b.IsPrimary = true;
        b.AdminLocked = true;
        await db.SaveChangesAsync();

        await _sut.SeedAsync(db, AsStream(Park), default);
        await db.SaveChangesAsync();

        var photos = await db.PlacePhotos.ToListAsync();
        photos.Should().HaveCount(2);
        photos.Single(p => p.IsPrimary).Url.Should().EndWith("b.jpg");
        photos.Single(p => p.Url.EndsWith("a.jpg")).AltText.Should().Be("Seed alt A", "unlocked photos still follow the seed");
    }

    [Fact]
    public async Task Re_seeding_keeps_the_details_an_administrator_edited()
    {
        // Traces to: L2-121 AC4
        using var db = TestDb.Create();
        await _sut.SeedAsync(db, AsStream(Park), default);
        await db.SaveChangesAsync();

        var a = await db.PlacePhotos.SingleAsync(p => p.Url.EndsWith("a.jpg"));
        a.AltText = "Admin alt";
        a.Attribution = "Photo · Admin";
        a.License = "Saturdaze owned";
        a.AdminLocked = true;
        await db.SaveChangesAsync();

        await _sut.SeedAsync(db, AsStream(Park), default);
        await db.SaveChangesAsync();

        var after = await db.PlacePhotos.SingleAsync(p => p.Url.EndsWith("a.jpg"));
        after.AltText.Should().Be("Admin alt");
        after.Attribution.Should().Be("Photo · Admin");
        after.License.Should().Be("Saturdaze owned");
        after.IsPrimary.Should().BeTrue("the seed and the administrator agree on the primary");
        after.AdminLocked.Should().BeTrue();
    }

    [Fact]
    public async Task Re_seeding_an_untouched_place_changes_nothing()
    {
        using var db = TestDb.Create();
        await _sut.SeedAsync(db, AsStream(Park), default);
        await db.SaveChangesAsync();
        await _sut.SeedAsync(db, AsStream(Park), default);
        await db.SaveChangesAsync();

        var photos = await db.PlacePhotos.ToListAsync();
        photos.Should().HaveCount(2);
        photos.Single(p => p.IsPrimary).Url.Should().EndWith("a.jpg");
        photos.Should().OnlyContain(p => p.ReviewState == PhotoReviewState.Reviewed && !p.AdminLocked);
    }

    private static Stream AsStream(string json) => new MemoryStream(Encoding.UTF8.GetBytes(json));
}
