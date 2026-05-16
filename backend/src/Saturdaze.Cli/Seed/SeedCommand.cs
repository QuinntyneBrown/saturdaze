using System.CommandLine;
using System.CommandLine.Invocation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Saturdaze.Cli.Database;
using Saturdaze.Cli.Hosting;

namespace Saturdaze.Cli.Seed;

public static class SeedCommand
{
    public static Command Build(string[] args)
    {
        var cmd = new Command("seed", "Seed catalog and family data from JSON files in the user-scope directory.");
        cmd.SetHandler(async (InvocationContext ctx) =>
        {
            var provider = ctx.ParseResult.GetValueForOption(GlobalOptions.Provider);
            var connection = ctx.ParseResult.GetValueForOption(GlobalOptions.Connection);
            var seedDir = ctx.ParseResult.GetValueForOption(GlobalOptions.SeedDir);
            var verbose = ctx.ParseResult.GetValueForOption(GlobalOptions.Verbose);

            var database = new DatabaseOptions
            {
                Provider = provider,
                ConnectionString = connection
            };

            using var host = CliHostFactory.Create(database, verbose, args).Build();
            using var scope = host.Services.CreateScope();
            var handler = scope.ServiceProvider.GetRequiredService<SeedCommandHandler>();
            ctx.ExitCode = await handler.ExecuteAsync(seedDir, ctx.GetCancellationToken());
        });
        return cmd;
    }
}
