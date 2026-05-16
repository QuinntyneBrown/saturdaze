using Microsoft.EntityFrameworkCore;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Cli.Database;

public sealed class DbContextRegistrar : IDbContextRegistrar
{
    public void Configure(DbContextOptionsBuilder builder, DatabaseOptions options)
    {
        switch (options.Provider)
        {
            case DatabaseProvider.SqlServer:
                builder.UseSqlServer(
                    RequireConnection(options),
                    sql => sql.MigrationsAssembly(typeof(AppDbContext).Assembly.GetName().Name));
                break;
            case DatabaseProvider.Sqlite:
                builder.UseSqlite(RequireConnection(options));
                break;
            case DatabaseProvider.InMemory:
                builder.UseInMemoryDatabase(options.ConnectionString ?? "saturdaze-cli");
                break;
            default:
                throw new InvalidOperationException($"Unknown provider '{options.Provider}'.");
        }
    }

    private static string RequireConnection(DatabaseOptions options)
        => string.IsNullOrWhiteSpace(options.ConnectionString)
            ? throw new InvalidOperationException(
                $"Provider '{options.Provider}' requires a connection string. " +
                "Pass --connection, set ConnectionStrings:Saturdaze, or set SATURDAZE_CONNECTION.")
            : options.ConnectionString;
}
