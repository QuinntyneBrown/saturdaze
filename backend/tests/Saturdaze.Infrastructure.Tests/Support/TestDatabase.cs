using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Infrastructure.Tests.Support;

/// <summary>
/// Owns a per-test-class SQL Server database. Applies migrations on construction
/// and drops the database on disposal. Disposable so xUnit IClassFixture cleans up.
/// </summary>
public sealed class TestDatabase : IAsyncDisposable
{
    public string DatabaseName { get; }
    public string ConnectionString { get; }

    private TestDatabase(string databaseName, string connectionString)
    {
        DatabaseName = databaseName;
        ConnectionString = connectionString;
    }

    public static async Task<TestDatabase> CreateAsync()
    {
        var dbName = $"Saturdaze_Test_{Guid.NewGuid():N}";
        var cs = LocalDbConnection.For(dbName);
        var db = new TestDatabase(dbName, cs);

        using var ctx = db.CreateContext();
        await ctx.Database.MigrateAsync();
        return db;
    }

    public AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(ConnectionString,
                sql => sql.MigrationsAssembly(typeof(AppDbContext).Assembly.GetName().Name))
            .Options;
        return new AppDbContext(options);
    }

    public async ValueTask DisposeAsync()
    {
        try
        {
            await using var conn = new SqlConnection(LocalDbConnection.Master());
            await conn.OpenAsync();
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = $@"
                IF DB_ID(@db) IS NOT NULL
                BEGIN
                    ALTER DATABASE [{DatabaseName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                    DROP DATABASE [{DatabaseName}];
                END";
            cmd.Parameters.AddWithValue("@db", DatabaseName);
            await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            // Best-effort cleanup; ignore errors.
        }
        SqlConnection.ClearAllPools();
    }
}
