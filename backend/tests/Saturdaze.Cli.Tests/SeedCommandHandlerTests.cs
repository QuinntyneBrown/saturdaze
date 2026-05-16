using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Cli.Seed;
using Xunit;

namespace Saturdaze.Cli.Tests;

public class SeedCommandHandlerTests : IDisposable
{
    private readonly string _dir;

    public SeedCommandHandlerTests()
    {
        _dir = Path.Combine(Path.GetTempPath(), "saturdaze-cli-tests-" + Guid.NewGuid());
        Directory.CreateDirectory(_dir);
    }

    public void Dispose()
    {
        if (Directory.Exists(_dir)) Directory.Delete(_dir, recursive: true);
    }

    private SeedCommandHandler CreateHandler(Saturdaze.Infrastructure.Persistence.AppDbContext db)
    {
        var paths = new StubPathResolver(_dir);
        var seeders = new IJsonSeeder[]
        {
            new ActivitySeeder(),
            new RestaurantSeeder(),
            new LocalEventSeeder(new SystemDateTimeProvider()),
            new FamilySeeder()
        };
        return new SeedCommandHandler(paths, seeders, db, NullLogger<SeedCommandHandler>.Instance);
    }

    [Fact]
    public async Task Returns_2_when_seed_directory_missing()
    {
        using var db = TestDb.Create();
        var missing = Path.Combine(_dir, "nope");
        var paths = new StubPathResolver(missing);
        var handler = new SeedCommandHandler(paths, Array.Empty<IJsonSeeder>(), db, NullLogger<SeedCommandHandler>.Instance);

        (await handler.ExecuteAsync(null, default)).Should().Be(2);
    }

    [Fact]
    public async Task Returns_3_when_directory_exists_but_no_files_found()
    {
        using var db = TestDb.Create();
        var handler = CreateHandler(db);
        (await handler.ExecuteAsync(null, default)).Should().Be(3);
    }

    [Fact]
    public async Task Seeds_all_catalogs_when_files_present()
    {
        await File.WriteAllTextAsync(
            Path.Combine(_dir, "activities.json"),
            """[ { "name": "Splash Pad", "category": "Outdoor" } ]""");
        await File.WriteAllTextAsync(
            Path.Combine(_dir, "restaurants.json"),
            """[ { "name": "Snug", "slot": "Dinner" } ]""");
        await File.WriteAllTextAsync(
            Path.Combine(_dir, "local-events.json"),
            """[ { "name": "Buskerfest", "startsOn": "2026-08-15", "endsOn": "2026-08-16" } ]""");
        await File.WriteAllTextAsync(
            Path.Combine(_dir, "family.json"),
            """{ "homeLocation": "Port Credit", "members": [ { "name": "Quinn", "age": 41 } ] }""");

        using var db = TestDb.Create();
        var handler = CreateHandler(db);

        (await handler.ExecuteAsync(null, default)).Should().Be(0);

        (await db.Activities.CountAsync()).Should().Be(1);
        (await db.Restaurants.CountAsync()).Should().Be(1);
        (await db.LocalEvents.CountAsync()).Should().Be(1);
        (await db.Families.CountAsync()).Should().Be(1);
        (await db.FamilyMembers.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Seeds_partial_when_only_some_files_present()
    {
        await File.WriteAllTextAsync(
            Path.Combine(_dir, "activities.json"),
            """[ { "name": "Splash Pad" } ]""");

        using var db = TestDb.Create();
        var handler = CreateHandler(db);

        (await handler.ExecuteAsync(null, default)).Should().Be(0);
        (await db.Activities.CountAsync()).Should().Be(1);
        (await db.Restaurants.CountAsync()).Should().Be(0);
    }

    private sealed class StubPathResolver : ISeedPathResolver
    {
        private readonly string _path;
        public StubPathResolver(string path) => _path = path;
        public string Resolve(string? overridePath) => overridePath ?? _path;
    }
}
