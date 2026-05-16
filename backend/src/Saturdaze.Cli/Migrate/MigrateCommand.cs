using System.CommandLine;
using System.CommandLine.Invocation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Saturdaze.Cli.Database;
using Saturdaze.Cli.Hosting;

namespace Saturdaze.Cli.Migrate;

/// <summary>
/// `saturdaze migrate` — applies pending EF Core migrations against the
/// configured database. Reuses <see cref="CliHostFactory"/> +
/// <see cref="DbContextRegistrar"/> so connection resolution and EF
/// configuration come from the same code path as `seed`.
/// </summary>
public static class MigrateCommand
{
    public static Command Build(string[] args)
    {
        var cmd = new Command("migrate", "Apply pending EF Core migrations to the configured database.");
        cmd.SetHandler(async (InvocationContext ctx) =>
        {
            var provider = ctx.ParseResult.GetValueForOption(GlobalOptions.Provider);
            var connection = ctx.ParseResult.GetValueForOption(GlobalOptions.Connection);
            var verbose = ctx.ParseResult.GetValueForOption(GlobalOptions.Verbose);

            var database = new DatabaseOptions
            {
                Provider = provider,
                ConnectionString = connection
            };

            using var host = CliHostFactory.Create(database, verbose, args).Build();
            using var scope = host.Services.CreateScope();
            var handler = scope.ServiceProvider.GetRequiredService<MigrateCommandHandler>();
            ctx.ExitCode = await handler.ExecuteAsync(ctx.GetCancellationToken());
        });
        return cmd;
    }
}
