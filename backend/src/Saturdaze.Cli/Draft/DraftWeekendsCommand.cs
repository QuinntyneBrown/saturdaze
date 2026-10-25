using System.CommandLine;
using System.CommandLine.Invocation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Saturdaze.Application;
using Saturdaze.Application.AgentPlanning;
using Saturdaze.Cli.Database;
using Saturdaze.Cli.Hosting;
using Saturdaze.Infrastructure;
using Saturdaze.Infrastructure.AgentPlanning;

namespace Saturdaze.Cli.Draft;

/// <summary>
/// <c>saturdaze draft-weekends</c> — drafts the upcoming weekend with the agents for every family
/// with "Friday preview" on (L2-203, ADR-023). The command the <c>draft</c> WebJob runs on Fridays.
/// It composes the same Application and Infrastructure services the API does, because a draft needs
/// the planner, the forecast, the calendar and the agents, not only the database.
/// </summary>
public static class DraftWeekendsCommand
{
    public static Command Build(string[] args)
    {
        var cmd = new Command("draft-weekends",
            "Draft the upcoming weekend with the agents for every family with the Friday preview on; a family the agents cannot draft keeps the planner's weekend.");

        cmd.SetHandler(async (InvocationContext ctx) =>
        {
            var database = new DatabaseOptions
            {
                Provider = ctx.ParseResult.GetValueForOption(GlobalOptions.Provider),
                ConnectionString = ctx.ParseResult.GetValueForOption(GlobalOptions.Connection),
            };
            var verbose = ctx.ParseResult.GetValueForOption(GlobalOptions.Verbose);

            using var host = CreateHost(database, verbose, args);
            using var scope = host.Services.CreateScope();
            var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("draft-weekends");
            var runs = await scope.ServiceProvider.GetRequiredService<ScheduledDrafts>().RunAsync(ctx.GetCancellationToken());
            foreach (var run in runs)
                logger.LogInformation("  run {RunId} {Status} {Reason} rounds={Rounds} calls={Calls} tokens={In}+{Out} cost=US${Cost}",
                    run.Id, run.Status, run.FallbackReason, run.Rounds, run.ModelCalls, run.InputTokens, run.OutputTokens, run.CostUsd);
            ctx.ExitCode = ScheduledDrafts.ExitCodeFor(runs);
        });

        return cmd;
    }

    /// <summary>The API's composition (Application, Infrastructure, agent planning) on the CLI's connection rules.</summary>
    private static IHost CreateHost(DatabaseOptions database, bool verbose, string[] args)
    {
        var builder = Host.CreateApplicationBuilder(args);
        builder.Configuration.SetBasePath(AppContext.BaseDirectory);
        builder.Configuration.AddJsonFile("appsettings.json", optional: true);
        builder.Configuration.AddEnvironmentVariables(prefix: "SATURDAZE_");
        CliHostFactory.ResolveConnection(database, builder.Configuration);
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:Saturdaze"] = database.ConnectionString,
            [Infrastructure.DependencyInjection.DatabaseProviderKey] = database.Provider == DatabaseProvider.Sqlite ? "Sqlite" : null,
        });
        builder.Logging.ClearProviders();
        builder.Logging.AddSimpleConsole(o => { o.SingleLine = true; o.TimestampFormat = "HH:mm:ss "; });
        builder.Logging.SetMinimumLevel(verbose ? LogLevel.Debug : LogLevel.Information);

        builder.Services.AddApplication();
        builder.Services.AddInfrastructure(builder.Configuration);
        builder.Services.AddAgentPlanning(builder.Configuration);
        return builder.Build();
    }
}
