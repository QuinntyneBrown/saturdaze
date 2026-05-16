using System.Text;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Cli.Seed;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Cli.Tests;

public class RestaurantSeederTests
{
    private readonly RestaurantSeeder _sut = new();

    [Fact]
    public void FileName_is_restaurants_json() => _sut.FileName.Should().Be("restaurants.json");

    [Fact]
    public async Task SeedAsync_inserts_records_with_enum_string_slot()
    {
        using var db = TestDb.Create();
        var json = """
            [
              { "name": "Snug Harbour", "style": "Seafood", "slot": "Dinner",
                "wifeApproved": true, "driveMinutes": 4, "notes": "Patio" },
              { "name": "Cora's",       "style": "Brunch",  "slot": "Lunch",
                "wifeApproved": true, "driveMinutes": 5 }
            ]
            """;

        var n = await _sut.SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        n.Should().Be(2);
        var snug = await db.Restaurants.SingleAsync(r => r.Name == "Snug Harbour");
        snug.Slot.Should().Be(MealSlot.Dinner);
        snug.Notes.Should().Be("Patio");
    }

    [Fact]
    public async Task SeedAsync_returns_zero_for_empty_array()
    {
        using var db = TestDb.Create();
        var n = await _sut.SeedAsync(db, AsStream("[]"), default);
        n.Should().Be(0);
    }

    [Fact]
    public async Task SeedAsync_is_idempotent_within_a_single_call()
    {
        using var db = TestDb.Create();
        var json = """
            [
              { "name": "Snug", "slot": "Dinner", "notes": "first",  "driveMinutes": 1 },
              { "name": "Snug", "slot": "Dinner", "notes": "second", "driveMinutes": 2 }
            ]
            """;

        await _sut.SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        var r = await db.Restaurants.SingleAsync();
        r.Notes.Should().Be("second");
        r.DriveMinutes.Should().Be(2);
    }

    [Fact]
    public async Task SeedAsync_skips_blank_names()
    {
        using var db = TestDb.Create();
        var json = """[ { "name": "", "slot": "Dinner" }, { "name": "Real", "slot": "Lunch" } ]""";
        var n = await _sut.SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();
        n.Should().Be(1);
        (await db.Restaurants.SingleAsync()).Name.Should().Be("Real");
    }

    private static Stream AsStream(string json) => new MemoryStream(Encoding.UTF8.GetBytes(json));
}
