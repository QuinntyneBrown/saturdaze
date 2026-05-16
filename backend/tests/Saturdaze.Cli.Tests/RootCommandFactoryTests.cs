using System.CommandLine;
using FluentAssertions;
using Xunit;

namespace Saturdaze.Cli.Tests;

public class RootCommandFactoryTests
{
    [Fact]
    public void Create_returns_root_with_seed_and_migrate_subcommands_and_global_options()
    {
        var root = RootCommandFactory.Create(Array.Empty<string>());

        root.Subcommands.Should().Contain(c => c.Name == "seed");
        root.Subcommands.Should().Contain(c => c.Name == "migrate");
        root.Options.Select(o => o.Name).Should().Contain(new[]
        {
            "provider", "connection", "seed-dir", "verbose"
        });
    }

    [Fact]
    public void Migrate_command_has_descriptive_help()
    {
        var root = RootCommandFactory.Create(Array.Empty<string>());
        var migrate = root.Subcommands.Single(c => c.Name == "migrate");
        migrate.Description.Should().Contain("migrations");
    }

    [Fact]
    public void Help_invocation_returns_zero()
    {
        var root = RootCommandFactory.Create(new[] { "--help" });
        var exit = root.Invoke(new[] { "--help" });
        exit.Should().Be(0);
    }

    [Fact]
    public void Seed_help_lists_json_in_description()
    {
        var root = RootCommandFactory.Create(Array.Empty<string>());
        var seed = root.Subcommands.Single(c => c.Name == "seed");
        seed.Description.Should().Contain("JSON");
    }
}
