using System.Text;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Cli.Seed;
using Xunit;

namespace Saturdaze.Cli.Tests;

public class LocalEventSeederTests
{
    private readonly LocalEventSeeder _sut = new();

    [Fact]
    public void FileName_is_local_events_json() => _sut.FileName.Should().Be("local-events.json");

    [Fact]
    public async Task SeedAsync_inserts_events_with_date_only_fields()
    {
        using var db = TestDb.Create();
        var json = """
            [
              { "name": "Buskerfest", "startsOn": "2026-08-15", "endsOn": "2026-08-16",
                "location": "Port Credit", "driveMinutes": 3, "url": "http://x", "category": "Festival" }
            ]
            """;

        var n = await _sut.SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        n.Should().Be(1);
        var ev = await db.LocalEvents.SingleAsync();
        ev.StartsOn.Should().Be(new DateOnly(2026, 8, 15));
        ev.EndsOn.Should().Be(new DateOnly(2026, 8, 16));
        ev.Location.Should().Be("Port Credit");
    }

    [Fact]
    public async Task SeedAsync_is_idempotent_within_a_single_call()
    {
        using var db = TestDb.Create();
        var json = """
            [
              { "name": "X", "startsOn": "2026-08-15", "endsOn": "2026-08-15", "category": "first" },
              { "name": "X", "startsOn": "2026-08-15", "endsOn": "2026-08-16", "category": "second" }
            ]
            """;

        await _sut.SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        var ev = await db.LocalEvents.SingleAsync();
        ev.Category.Should().Be("second");
        ev.EndsOn.Should().Be(new DateOnly(2026, 8, 16));
    }

    [Fact]
    public async Task SeedAsync_returns_zero_for_empty_array()
    {
        using var db = TestDb.Create();
        var n = await _sut.SeedAsync(db, AsStream("[]"), default);
        n.Should().Be(0);
    }

    [Fact]
    public async Task SeedAsync_skips_blank_names()
    {
        using var db = TestDb.Create();
        var json = """[ { "name": "", "startsOn": "2026-08-15", "endsOn": "2026-08-15" } ]""";
        var n = await _sut.SeedAsync(db, AsStream(json), default);
        n.Should().Be(0);
    }

    private static Stream AsStream(string json) => new MemoryStream(Encoding.UTF8.GetBytes(json));
}
