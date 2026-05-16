using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Cli.Database;
using Saturdaze.Cli.Reset;
using Saturdaze.Cli.Seed;
using Xunit;

namespace Saturdaze.Cli.Tests;

public class ResetCommandHandlerTests : IDisposable
{
    private readonly string _dir;

    public ResetCommandHandlerTests()
    {
        _dir = Path.Combine(Path.GetTempPath(), "saturdaze-reset-tests-" + Guid.NewGuid());
        Directory.CreateDirectory(_dir);
    }

    public void Dispose()
    {
        if (Directory.Exists(_dir)) Directory.Delete(_dir, recursive: true);
    }

    [Fact]
    public async Task ExecuteAsync_deletes_existing_data_recreates_schema_and_seeds()
    {
        await File.WriteAllTextAsync(
            Path.Combine(_dir, "activities.json"),
            """[ { "name": "Fresh Splash Pad", "category": "Outdoor" } ]""");

        const string dbName = "reset-test";
        using (var existing = TestDb.Create(dbName))
        {
            existing.Activities.Add(new() { Name = "Stale Activity" });
            await existing.SaveChangesAsync();
        }

        using var db = TestDb.Create(dbName);
        var handler = CreateHandler(db);

        (await handler.ExecuteAsync(_dir, default)).Should().Be(0);

        var activities = await db.Activities.Select(a => a.Name).ToListAsync();
        activities.Should().Equal("Fresh Splash Pad");
    }

    private ResetCommandHandler CreateHandler(Saturdaze.Infrastructure.Persistence.AppDbContext db)
    {
        var seed = new SeedCommandHandler(
            new StubPathResolver(_dir),
            new IJsonSeeder[]
            {
                new ActivitySeeder(),
                new RestaurantSeeder(),
                new LocalEventSeeder(new SystemDateTimeProvider()),
                new FamilySeeder()
            },
            db,
            NullLogger<SeedCommandHandler>.Instance);

        return new ResetCommandHandler(
            db,
            new DatabaseOptions { Provider = DatabaseProvider.InMemory },
            seed,
            NullLogger<ResetCommandHandler>.Instance);
    }

    private sealed class StubPathResolver : ISeedPathResolver
    {
        private readonly string _path;
        public StubPathResolver(string path) => _path = path;
        public string Resolve(string? overridePath) => overridePath ?? _path;
        public string BundleDirectory => Path.Combine(_path, ".__no_bundle__");
    }
}
