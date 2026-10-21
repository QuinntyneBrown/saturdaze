using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Infrastructure.Tests.Support;

/// <summary>
/// Owns a per-test-class in-memory SQLite database (ADR-020), with the schema the API
/// creates on SQLite. The database lives until disposal, which closes its last connection.
/// </summary>
public sealed class TestDatabase : IAsyncDisposable
{
    private readonly SqliteConnection _keepAlive;

    public string ConnectionString { get; }

    private TestDatabase(string connectionString)
    {
        ConnectionString = connectionString;
        _keepAlive = new SqliteConnection(connectionString);
    }

    public static async Task<TestDatabase> CreateAsync()
    {
        var db = new TestDatabase($"Data Source=Saturdaze_Test_{Guid.NewGuid():N};Mode=Memory;Cache=Shared");
        await db._keepAlive.OpenAsync();

        await using var ctx = db.CreateContext();
        await ctx.EnsureSqliteSchemaAsync();
        return db;
    }

    public AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(ConnectionString)
            .Options;
        return new AppDbContext(options);
    }

    public async ValueTask DisposeAsync() => await _keepAlive.DisposeAsync();
}
