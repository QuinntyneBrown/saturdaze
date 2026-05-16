using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Infrastructure.Persistence;
using Saturdaze.Infrastructure.SeedData;
using Xunit;

namespace Saturdaze.Api.Tests.Support;

/// <summary>
/// Boots the API in-process against a per-fixture LocalDB database.
/// Applies migrations on first construction and drops the database on disposal.
/// </summary>
public sealed class SaturdazeApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public string DatabaseName { get; } = $"Saturdaze_Api_{Guid.NewGuid():N}";
    public string ConnectionString { get; }

    public SaturdazeApiFactory()
    {
        ConnectionString = LocalDbConnection.For(DatabaseName);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, cfg) =>
        {
            cfg.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Saturdaze"] = ConnectionString
            });
        });
    }

    public async Task InitializeAsync()
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(ConnectionString,
                sql => sql.MigrationsAssembly(typeof(AppDbContext).Assembly.GetName().Name));
        await using var ctx = new AppDbContext(optionsBuilder.Options);
        await ctx.Database.MigrateAsync();
        // Seed for tests that need a family / catalog. Pipeline tests will tolerate the extra data.
        await SeedDataLoader.SeedAsync(ctx);
        // Force lazy WebApplicationFactory build so configuration is honored before tests.
        _ = Services;
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        try
        {
            await using var conn = new SqlConnection(LocalDbConnection.For("master"));
            await conn.OpenAsync();
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = $@"
                IF DB_ID('{DatabaseName}') IS NOT NULL
                BEGIN
                    ALTER DATABASE [{DatabaseName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                    DROP DATABASE [{DatabaseName}];
                END";
            await cmd.ExecuteNonQueryAsync();
        }
        catch
        {
            // best-effort cleanup
        }
        SqlConnection.ClearAllPools();
        await base.DisposeAsync();
    }
}
