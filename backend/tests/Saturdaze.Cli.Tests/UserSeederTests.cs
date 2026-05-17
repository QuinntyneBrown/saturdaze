using System.Text;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Cli.Seed;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Authentication;
using Xunit;

namespace Saturdaze.Cli.Tests;

public class UserSeederTests
{
    private readonly IPasswordHasher _hasher = new Pbkdf2PasswordHasher();
    private readonly IDateTimeProvider _clock = new SystemDateTimeProvider();

    private UserSeeder CreateSut() => new(_hasher, _clock);

    [Fact]
    public void FileName_is_users_json() => CreateSut().FileName.Should().Be("users.json");

    [Fact]
    public async Task SeedAsync_inserts_user_when_missing_and_hashes_password()
    {
        using var db = TestDb.Create();
        var json = """
            [
              {
                "email": "Quinn@Example.com",
                "password": "password123",
                "role": "User",
                "emailVerified": true
              }
            ]
            """;

        var written = await CreateSut().SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        written.Should().Be(1);
        var user = await db.Users.SingleAsync();
        user.Email.Should().Be("Quinn@Example.com");
        user.NormalizedEmail.Should().Be("quinn@example.com");
        user.PasswordHash.Should().NotBe("password123");
        _hasher.Verify(user.PasswordHash, "password123").Should().BeTrue();
        user.EmailVerifiedUtc.Should().NotBeNull();
        user.Role.Should().Be(UserRole.User);
    }

    [Fact]
    public async Task SeedAsync_links_user_to_family_by_home_location_already_in_db()
    {
        using var db = TestDb.Create();
        var family = new Family
        {
            Id = Guid.NewGuid(),
            HomeLocation = "Port Credit, Mississauga, ON",
        };
        db.Families.Add(family);
        await db.SaveChangesAsync();

        var json = """
            [
              {
                "email": "quinntynebrown@gmail.com",
                "password": "password123",
                "familyHomeLocation": "Port Credit, Mississauga, ON"
              }
            ]
            """;

        await CreateSut().SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        var user = await db.Users.SingleAsync();
        user.FamilyId.Should().Be(family.Id);
    }

    [Fact]
    public async Task SeedAsync_links_user_to_family_added_in_same_call_via_change_tracker()
    {
        using var db = TestDb.Create();
        var family = new Family
        {
            Id = Guid.NewGuid(),
            HomeLocation = "Port Credit, Mississauga, ON",
        };
        db.Families.Add(family);

        var json = """
            [
              {
                "email": "quinntynebrown@gmail.com",
                "password": "password123",
                "familyHomeLocation": "Port Credit, Mississauga, ON"
              }
            ]
            """;

        await CreateSut().SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        var user = await db.Users.SingleAsync();
        user.FamilyId.Should().Be(family.Id);
    }

    [Fact]
    public async Task SeedAsync_updates_existing_user_and_re_hashes_password()
    {
        using var db = TestDb.Create();
        var initialHash = _hasher.Hash("old-secret");
        db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            Email = "quinntynebrown@gmail.com",
            NormalizedEmail = "quinntynebrown@gmail.com",
            PasswordHash = initialHash,
            Role = UserRole.User,
            CreatedAtUtc = DateTimeOffset.UtcNow.AddDays(-7),
            UpdatedAtUtc = DateTimeOffset.UtcNow.AddDays(-7),
        });
        await db.SaveChangesAsync();

        var json = """
            [
              {
                "email": "quinntynebrown@gmail.com",
                "password": "password123"
              }
            ]
            """;

        await CreateSut().SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        db.Users.Should().ContainSingle();
        var user = await db.Users.SingleAsync();
        user.PasswordHash.Should().NotBe(initialHash);
        _hasher.Verify(user.PasswordHash, "password123").Should().BeTrue();
    }

    [Fact]
    public async Task SeedAsync_skips_blank_email_or_password()
    {
        using var db = TestDb.Create();
        var json = """
            [
              { "email": "", "password": "x" },
              { "email": "a@b.c", "password": "" },
              { "email": "real@example.com", "password": "password123" }
            ]
            """;

        var written = await CreateSut().SeedAsync(db, AsStream(json), default);
        await db.SaveChangesAsync();

        written.Should().Be(1);
        (await db.Users.CountAsync()).Should().Be(1);
        (await db.Users.SingleAsync()).NormalizedEmail.Should().Be("real@example.com");
    }

    [Fact]
    public async Task SeedAsync_returns_zero_when_payload_is_null_or_empty()
    {
        using var db = TestDb.Create();
        var sut = CreateSut();

        (await sut.SeedAsync(db, AsStream("null"), default)).Should().Be(0);
        (await sut.SeedAsync(db, AsStream("[]"), default)).Should().Be(0);
        (await db.Users.CountAsync()).Should().Be(0);
    }

    private static Stream AsStream(string json) => new MemoryStream(Encoding.UTF8.GetBytes(json));
}
