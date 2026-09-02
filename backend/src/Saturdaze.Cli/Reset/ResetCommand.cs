using System.CommandLine;
using System.CommandLine.Invocation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Saturdaze.Cli.Database;
using Saturdaze.Cli.Hosting;

namespace Saturdaze.Cli.Reset;

public static class ResetCommand
{
    public static Command Build(string[] args)
    {
        var cmd = new Command("reset", "Drop, migrate, and seed the configured database.");
        var yes = new Option<bool>("--yes", "Confirm the destructive database reset.");
        var allowProduction = new Option<bool>("--allow-production",
            "Permit the reset when DOTNET_ENVIRONMENT / ASPNETCORE_ENVIRONMENT is Production.");
        cmd.AddOption(yes);
        cmd.AddOption(allowProduction);

        cmd.SetHandler(async (InvocationContext ctx) =>
        {
            if (!ctx.ParseResult.GetValueForOption(yes))
            {
                Console.Error.WriteLine("Refusing to reset without --yes.");
                ctx.ExitCode = 4;
                return;
            }

            if (ResetGuard.IsProductionBlocked(
                    ResetGuard.CurrentEnvironmentName(),
                    ctx.ParseResult.GetValueForOption(allowProduction)))
            {
                Console.Error.WriteLine("Refusing to reset a Production database. Pass --allow-production to override.");
                ctx.ExitCode = ResetGuard.BlockedExitCode;
                return;
            }

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
            var handler = scope.ServiceProvider.GetRequiredService<ResetCommandHandler>();
            ctx.ExitCode = await handler.ExecuteAsync(seedDir, ctx.GetCancellationToken());
        });

        return cmd;
    }
}
