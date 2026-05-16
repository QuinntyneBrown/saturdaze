using FluentAssertions;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Saturdaze.Cli.Database;
using Saturdaze.Cli.Migrate;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Cli.Tests;

public class MigrateCommandHandlerTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly AppDbContext _db;

    public MigrateCommandHandlerTests()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
        _db = new AppDbContext(options);
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task ExecuteAsync_applies_pending_migrations_against_sqlite()
    {
        var options = new DatabaseOptions
        {
            Provider = DatabaseProvider.Sqlite,
            ConnectionString = "DataSource=:memory:"
        };
        var handler = new MigrateCommandHandler(_db, options, NullLogger<MigrateCommandHandler>.Instance);

        var exit = await handler.ExecuteAsync(default);

        exit.Should().Be(0);
        // After migrate, every entity table exists and is queryable.
        (await _db.Activities.CountAsync()).Should().Be(0);
        (await _db.Weekends.CountAsync()).Should().Be(0);
    }
}
