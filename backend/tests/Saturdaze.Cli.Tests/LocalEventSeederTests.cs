using System.Text;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Common;
using Saturdaze.Cli.Seed;
using Xunit;

namespace Saturdaze.Cli.Tests;

public class LocalEventSeederTests
{
    private readonly FixedClock _clock = new(new DateOnly(2026, 5, 16));
    private readonly LocalEventSeeder _sut;

    public LocalEventSeederTests()
    {
        _sut = new LocalEventSeeder(_clock);
    }

    private sealed class FixedClock : IDateTimeProvider
    {
        public FixedClock(DateOnly today) { Today = today; }
        public DateOnly Today { get; set; }
        public DateTimeOffset UtcNow => Today.ToDateTime(TimeOnly.MinValue);
    }

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

    [Fact]
    public async Task SeedAsync_envelope_shifts_dates_to_current_upcoming_saturday()
    {
        using var db = TestDb.Create();
        _clock.Today = new DateOnly(2027, 5, 15); // Saturday 2027-05-15

        var json = """
            {
              "anchorSaturday": "2026-05-16",
              "events": [
                { "name": "Lavender", "startsOn": "2026-05-16", "endsOn": "2026-05-16" },
                { "name": "Symphony", "startsOn": "2026-05-17", "endsOn": "2026-05-17" }
              ]
            }
            """;

        var n = await _sut.SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        n.Should().Be(2);
        var lav = await db.LocalEvents.SingleAsync(e => e.Name == "Lavender");
        lav.StartsOn.Should().Be(new DateOnly(2027, 5, 15)); // Saturday 2027-05-15
        var sym = await db.LocalEvents.SingleAsync(e => e.Name == "Symphony");
        sym.StartsOn.Should().Be(new DateOnly(2027, 5, 16)); // Sunday
    }

    [Fact]
    public async Task SeedAsync_envelope_with_matching_anchor_does_not_shift()
    {
        using var db = TestDb.Create();
        _clock.Today = new DateOnly(2026, 5, 16); // anchor

        var json = """
            {
              "anchorSaturday": "2026-05-16",
              "events": [
                { "name": "Lavender", "startsOn": "2026-05-16", "endsOn": "2026-05-16" }
              ]
            }
            """;

        await _sut.SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        var lav = await db.LocalEvents.SingleAsync();
        lav.StartsOn.Should().Be(new DateOnly(2026, 5, 16));
    }

    private static Stream AsStream(string json) => new MemoryStream(Encoding.UTF8.GetBytes(json));
}
