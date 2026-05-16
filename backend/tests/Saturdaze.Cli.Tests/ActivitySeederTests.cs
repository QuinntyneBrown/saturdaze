using System.Text;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Cli.Seed;
using Xunit;

namespace Saturdaze.Cli.Tests;

public class ActivitySeederTests
{
    private readonly ActivitySeeder _sut = new();

    [Fact]
    public void FileName_is_activities_json() => _sut.FileName.Should().Be("activities.json");

    [Fact]
    public async Task SeedAsync_inserts_new_activities()
    {
        using var db = TestDb.Create();
        var json = """
            [
              { "name": "Splash Pad", "category": "Outdoor", "indoor": false, "minAge": 2, "maxAge": 12,
                "driveMinutes": 10, "weatherTags": ["hot","sunny"], "typicalDurationMinutes": 60,
                "description": "Pad", "mapUrl": "http://m" },
              { "name": "Lego Cafe", "category": "Indoor", "indoor": true, "minAge": 3, "maxAge": 12,
                "driveMinutes": 25, "weatherTags": ["rain"], "typicalDurationMinutes": 90,
                "description": "Lego", "mapUrl": "http://m2" }
            ]
            """;

        var n = await _sut.SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        n.Should().Be(2);
        var splash = await db.Activities.SingleAsync(a => a.Name == "Splash Pad");
        splash.Indoor.Should().BeFalse();
        splash.WeatherTags.Should().BeEquivalentTo(new[] { "hot", "sunny" });
        splash.TypicalDurationMinutes.Should().Be(60);
    }

    [Fact]
    public async Task SeedAsync_is_idempotent_within_a_single_call()
    {
        using var db = TestDb.Create();
        var json = """
            [
              { "name": "Splash Pad", "driveMinutes": 10, "description": "old" },
              { "name": "Splash Pad", "driveMinutes": 15, "description": "new" }
            ]
            """;

        await _sut.SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        var a = await db.Activities.SingleAsync();
        a.DriveMinutes.Should().Be(15);
        a.Description.Should().Be("new");
    }

    [Fact]
    public async Task SeedAsync_skips_rows_with_blank_name()
    {
        using var db = TestDb.Create();
        var json = """
            [
              { "name": "", "category": "x" },
              { "name": "Real", "category": "y" }
            ]
            """;

        var n = await _sut.SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        n.Should().Be(1);
        (await db.Activities.SingleAsync()).Name.Should().Be("Real");
    }

    [Fact]
    public async Task SeedAsync_returns_zero_for_empty_array()
    {
        using var db = TestDb.Create();
        var n = await _sut.SeedAsync(db, AsStream("[]"), default);
        n.Should().Be(0);
    }

    [Fact]
    public async Task SeedAsync_handles_missing_optional_fields()
    {
        using var db = TestDb.Create();
        var json = """[ { "name": "Minimal" } ]""";
        await _sut.SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        var a = await db.Activities.SingleAsync();
        a.Category.Should().Be(string.Empty);
        a.WeatherTags.Should().BeEmpty();
        a.MapUrl.Should().Be(string.Empty);
    }

    private static Stream AsStream(string json) => new MemoryStream(Encoding.UTF8.GetBytes(json));
}
