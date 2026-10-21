using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Domain.Entities;
using Saturdaze.Infrastructure.Persistence;
using Saturdaze.Infrastructure.Tests.Support;
using Xunit;

namespace Saturdaze.Infrastructure.Tests.Persistence;

/// <summary>
/// The migrations are SQL Server's (ADR-020): the default run checks they cover the model
/// without a server, and the opt-in tests apply them to a real one.
/// </summary>
public class SqlServerMigrationTests : IAsyncLifetime
{
    private SqlServerTestDatabase? _db;

    public async Task InitializeAsync()
    {
        if (LocalDbConnection.Enabled) _db = await SqlServerTestDatabase.CreateAsync();
    }

    public async Task DisposeAsync()
    {
        if (_db is not null) await _db.DisposeAsync();
    }

    [Fact]
    public void Committed_migrations_cover_the_model()
    {
        // No connection is opened: the SQL Server model is compared with the migrations' snapshot,
        // so a model change without its migration fails here rather than in `saturdaze migrate`.
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer("Server=unused;Database=unused",
                sql => sql.MigrationsAssembly(typeof(AppDbContext).Assembly.GetName().Name))
            .Options;
        using var ctx = new AppDbContext(options);

        ctx.Database.HasPendingModelChanges().Should().BeFalse();
    }

    [Trait("Category", "SqlServer")]
    [SqlServerFact]
    public async Task Ingestion_migration_upgrades_a_database_already_on_main()
    {
        await using var ctx = _db!.CreateContext();
        // Reproduce main's schema and history: the location-aware index exists,
        // but the ingestion migration has not been applied.
        await ctx.Database.ExecuteSqlRawAsync("DROP TABLE [IngestionRuns]");
        await ctx.Database.ExecuteSqlRawAsync(
            "DELETE FROM [__EFMigrationsHistory] WHERE [MigrationId] = '20260528234946_AddIngestionRuns'");

        await ctx.Database.MigrateAsync();

        (await ctx.IngestionRuns.CountAsync()).Should().Be(0);
        var startsOn = new DateOnly(2026, 10, 10);
        ctx.LocalEvents.AddRange(
            new LocalEvent { Id = Guid.NewGuid(), Name = "Upgrade test", StartsOn = startsOn,
                EndsOn = startsOn, Location = "Venue A", Category = "Community" },
            new LocalEvent { Id = Guid.NewGuid(), Name = "Upgrade test", StartsOn = startsOn,
                EndsOn = startsOn, Location = "Venue B", Category = "Community" });
        await ctx.SaveChangesAsync();
        (await ctx.LocalEvents.CountAsync(e => e.Name == "Upgrade test")).Should().Be(2);
        (await ctx.Database.GetPendingMigrationsAsync()).Should().BeEmpty();
    }
}
