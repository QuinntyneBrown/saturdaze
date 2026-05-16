using System.Text;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Cli.Seed;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Cli.Tests;

public class FamilySeederTests
{
    private readonly FamilySeeder _sut = new();

    [Fact]
    public void FileName_is_family_json() => _sut.FileName.Should().Be("family.json");

    [Fact]
    public async Task SeedAsync_creates_family_with_members_commitments_preferences()
    {
        using var db = TestDb.Create();
        var json = """
            {
              "homeLocation": "Port Credit, Mississauga, ON",
              "budgetEnabled": false,
              "members": [
                { "name": "Quinn", "age": 41 },
                { "name": "Theo",  "age": 9 }
              ],
              "commitments": [
                { "title": "Swim", "dayOfWeek": "Saturday", "startTime": "09:30", "endTime": "10:30" }
              ],
              "preferences": [
                { "kind": "Like", "value": "outdoors" }
              ]
            }
            """;

        await _sut.SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        var family = await db.Families
            .Include(f => f.Members)
            .Include(f => f.Commitments)
            .Include(f => f.Preferences)
            .SingleAsync();

        family.HomeLocation.Should().Be("Port Credit, Mississauga, ON");
        family.Members.Should().HaveCount(2);
        family.Commitments.Should().ContainSingle()
            .Which.DayOfWeek.Should().Be(DayOfWeek.Saturday);
        family.Preferences.Should().ContainSingle()
            .Which.Kind.Should().Be(PreferenceKind.Like);
    }

    [Fact]
    public async Task SeedAsync_dedupes_member_by_name_within_call()
    {
        using var db = TestDb.Create();
        var json = """
            {
              "homeLocation": "X",
              "members": [
                { "name": "Quinn", "age": 41 },
                { "name": "Quinn", "age": 42 }
              ]
            }
            """;

        await _sut.SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        var member = await db.FamilyMembers.SingleAsync();
        member.Age.Should().Be(42);
    }

    [Fact]
    public async Task SeedAsync_returns_zero_when_home_location_missing()
    {
        using var db = TestDb.Create();
        var json = """{ "homeLocation": "", "members": [] }""";
        var n = await _sut.SeedAsync(db, AsStream(json), default);
        n.Should().Be(0);
    }

    [Fact]
    public async Task SeedAsync_returns_zero_when_payload_is_null()
    {
        using var db = TestDb.Create();
        var n = await _sut.SeedAsync(db, AsStream("null"), default);
        n.Should().Be(0);
    }

    [Fact]
    public async Task SeedAsync_skips_blank_titles_and_values()
    {
        using var db = TestDb.Create();
        var json = """
            {
              "homeLocation": "X",
              "commitments": [
                { "title": "", "dayOfWeek": "Saturday", "startTime": "09:00", "endTime": "10:00" }
              ],
              "preferences": [
                { "kind": "Like", "value": "" }
              ]
            }
            """;

        await _sut.SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        (await db.Commitments.CountAsync()).Should().Be(0);
        (await db.Preferences.CountAsync()).Should().Be(0);
    }

    private static Stream AsStream(string json) => new MemoryStream(Encoding.UTF8.GetBytes(json));
}
