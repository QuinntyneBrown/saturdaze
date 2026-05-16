using System.CommandLine;
using Saturdaze.Cli.Hosting;
using Saturdaze.Cli.Migrate;
using Saturdaze.Cli.Reset;
using Saturdaze.Cli.Seed;

namespace Saturdaze.Cli;

public static class RootCommandFactory
{
    public static RootCommand Create(string[] args)
    {
        var root = new RootCommand("Saturdaze CLI — weekend-planning tools for the Brown family.");
        root.AddGlobalOption(GlobalOptions.Provider);
        root.AddGlobalOption(GlobalOptions.Connection);
        root.AddGlobalOption(GlobalOptions.SeedDir);
        root.AddGlobalOption(GlobalOptions.Verbose);
        root.AddCommand(SeedCommand.Build(args));
        root.AddCommand(MigrateCommand.Build(args));
        root.AddCommand(ResetCommand.Build(args));
        return root;
    }
}
