using System.CommandLine;
using System.CommandLine.Invocation;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Saturdaze.Cli.Database;
using Saturdaze.Cli.Hosting;

namespace Saturdaze.Cli.Ingest;

/// <summary>
/// <c>saturdaze ingest [--type events|activities|restaurants|all] [--dry-run]</c>
/// — refreshes a catalog from a grounded LLM web search. Mirrors the
/// <c>migrate</c> / <c>seed</c> command shape: parse argv here, do the work in a
/// DI-resolved handler. This is both the on-demand entry point for the curator
/// and the command the scheduled Worker/WebJob invokes.
/// </summary>
public static class IngestCommand
{
    public static readonly Option<string> Type =
        new("--type", () => "all", "Which catalog(s) to refresh: events, activities, restaurants, or all.");

    public static readonly Option<bool> DryRun =
        new("--dry-run", "Call the model and parse the result, but write nothing (no catalog rows, no audit row).");

    public static Command Build(string[] args)
    {
        var cmd = new Command("ingest", "Refresh catalog rows from a grounded AI web search.");
        cmd.AddOption(Type);
        cmd.AddOption(DryRun);

        cmd.SetHandler(async (InvocationContext ctx) =>
        {
            var provider = ctx.ParseResult.GetValueForOption(GlobalOptions.Provider);
            var connection = ctx.ParseResult.GetValueForOption(GlobalOptions.Connection);
            var verbose = ctx.ParseResult.GetValueForOption(GlobalOptions.Verbose);
            var type = ctx.ParseResult.GetValueForOption(Type);
            var dryRun = ctx.ParseResult.GetValueForOption(DryRun);

            var database = new DatabaseOptions
            {
                Provider = provider,
                ConnectionString = connection
            };

            using var host = CliHostFactory.Create(database, verbose, args).Build();
            using var scope = host.Services.CreateScope();
            var handler = scope.ServiceProvider.GetRequiredService<IngestCommandHandler>();
            ctx.ExitCode = await handler.ExecuteAsync(type, dryRun, ctx.GetCancellationToken());
        });

        return cmd;
    }
}
