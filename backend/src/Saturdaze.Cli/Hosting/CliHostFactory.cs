using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Saturdaze.Application.Common;
using Saturdaze.Cli.Database;
using Saturdaze.Cli.Seed;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Cli.Hosting;

public static class CliHostFactory
{
    public static IHostBuilder Create(DatabaseOptions database, bool verbose, string[] args)
    {
        return Host.CreateDefaultBuilder(args)
            .ConfigureAppConfiguration(cfg =>
            {
                cfg.SetBasePath(AppContext.BaseDirectory);
                cfg.AddJsonFile("appsettings.json", optional: true);
                cfg.AddEnvironmentVariables(prefix: "SATURDAZE_");
                cfg.AddEnvironmentVariables();
                cfg.AddCommandLine(args);
            })
            .ConfigureLogging((ctx, log) =>
            {
                log.ClearProviders();
                log.AddSimpleConsole(o =>
                {
                    o.SingleLine = true;
                    o.TimestampFormat = "HH:mm:ss ";
                });
                log.SetMinimumLevel(verbose ? LogLevel.Debug : LogLevel.Information);
            })
            .ConfigureServices((ctx, services) =>
            {
                ResolveConnection(database, ctx.Configuration);
                services.AddSingleton(database);
                services.AddSingleton<IDbContextRegistrar, DbContextRegistrar>();
                services.AddDbContext<AppDbContext>((sp, opt) =>
                {
                    var registrar = sp.GetRequiredService<IDbContextRegistrar>();
                    var opts = sp.GetRequiredService<DatabaseOptions>();
                    registrar.Configure(opt, opts);
                });

                services.AddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
                services.AddSingleton<ISeedPathResolver, SeedPathResolver>();
                services.AddSingleton<IJsonSeeder, ActivitySeeder>();
                services.AddSingleton<IJsonSeeder, RestaurantSeeder>();
                services.AddSingleton<IJsonSeeder, LocalEventSeeder>();
                services.AddSingleton<IJsonSeeder, FamilySeeder>();
                services.AddScoped<SeedCommandHandler>();
            });
    }

    internal static void ResolveConnection(DatabaseOptions database, IConfiguration configuration)
    {
        if (!string.IsNullOrWhiteSpace(database.ConnectionString))
            return;

        var fromConfig = configuration.GetConnectionString("Saturdaze")
            ?? configuration["Saturdaze:ConnectionString"]
            ?? Environment.GetEnvironmentVariable("SATURDAZE_CONNECTION");

        if (!string.IsNullOrWhiteSpace(fromConfig))
        {
            database.ConnectionString = fromConfig;
            return;
        }

        if (database.Provider == DatabaseProvider.Sqlite)
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            if (string.IsNullOrWhiteSpace(appData))
                appData = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                    ".config");

            var dir = Path.Combine(appData, SeedPathResolver.FolderName);
            Directory.CreateDirectory(dir);
            database.ConnectionString = $"Data Source={Path.Combine(dir, "saturdaze.db")}";
        }
    }
}
