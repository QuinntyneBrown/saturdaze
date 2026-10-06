using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Cli.Seed;
using Saturdaze.Infrastructure.Authentication;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Cli.Tests;

/// <summary>L2-087 AC1: the bundled seed gives every place coordinates, idempotently.</summary>
public class BundledSeedLocationTests
{
    private static readonly string Bundle = Path.Combine(AppContext.BaseDirectory, "Seed", "Data");

    private sealed class BundlePath : ISeedPathResolver
    {
        public string Resolve(string? overridePath) => overridePath ?? Bundle;
        public string BundleDirectory => Bundle;
    }

    private static Task<int> Seed(AppDbContext db)
    {
        var clock = new SystemDateTimeProvider();
        var seeders = new IJsonSeeder[]
        {
            new ActivitySeeder(),
            new RestaurantSeeder(),
            new LocalEventSeeder(clock),
            new FamilySeeder(),
            new UserSeeder(new Pbkdf2PasswordHasher(), clock),
        };
        return new SeedCommandHandler(new BundlePath(), seeders, db, NullLogger<SeedCommandHandler>.Instance)
            .ExecuteAsync(null, default);
    }

    private static async Task<List<string>> Snapshot(AppDbContext db) =>
        (await db.Activities.AsNoTracking().Select(a => $"A|{a.Name}|{a.Geo!.Latitude}|{a.Geo.Longitude}|{a.Geo.Address}").ToListAsync())
        .Concat(await db.Restaurants.AsNoTracking().Select(r => $"R|{r.Name}|{r.Geo!.Latitude}|{r.Geo.Longitude}|{r.Geo.Address}").ToListAsync())
        .Concat(await db.LocalEvents.AsNoTracking().Select(e => $"E|{e.Name}|{e.Geo!.Latitude}|{e.Geo.Longitude}|{e.Geo.Address}").ToListAsync())
        .OrderBy(s => s)
        .ToList();

    [Fact]
    public async Task Seeding_twice_gives_every_place_coordinates_and_changes_nothing_the_second_time()
    {
        var name = "bundle-" + Guid.NewGuid();
        await using (var db = TestDb.Create(name))
        {
            await Seed(db);
            (await db.Activities.AnyAsync()).Should().BeTrue();
            (await db.Activities.Where(a => a.Geo == null).Select(a => a.Name).ToListAsync()).Should().BeEmpty();
            (await db.Restaurants.Where(r => r.Geo == null).Select(r => r.Name).ToListAsync()).Should().BeEmpty();
            (await db.LocalEvents.Where(e => e.Geo == null).Select(e => e.Name).ToListAsync()).Should().BeEmpty();
            (await db.Families.Where(f => f.HomeCoordinates == null).CountAsync()).Should().Be(0);
        }

        List<string> first;
        await using (var db = TestDb.Create(name)) first = await Snapshot(db);

        await using (var db = TestDb.Create(name)) await Seed(db);

        await using (var db = TestDb.Create(name)) (await Snapshot(db)).Should().Equal(first);
    }
}
