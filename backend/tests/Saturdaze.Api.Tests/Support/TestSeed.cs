using Microsoft.Extensions.Logging.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Cli.Seed;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Api.Tests.Support;

internal static class TestSeed
{
    private static readonly string FixtureRoot =
        Path.Combine(AppContext.BaseDirectory, "SeedData");

    private static readonly IJsonSeeder[] Seeders =
    {
        new ActivitySeeder(),
        new RestaurantSeeder(),
        new LocalEventSeeder(new SystemDateTimeProvider()),
        new FamilySeeder()
    };

    private sealed class FixedPath : ISeedPathResolver
    {
        private readonly string _path;
        public FixedPath(string path) => _path = path;
        public string Resolve(string? overridePath) => overridePath ?? _path;
        public string BundleDirectory => Path.Combine(_path, ".__no_bundle__");
    }

    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        var handler = new SeedCommandHandler(
            new FixedPath(FixtureRoot),
            Seeders,
            db,
            NullLogger<SeedCommandHandler>.Instance);
        await handler.ExecuteAsync(null, ct);
    }
}
