using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Saturdaze.Cli.Database;
using Saturdaze.Cli.Hosting;
using Xunit;

namespace Saturdaze.Cli.Tests;

public class CliHostFactoryTests
{
    [Fact]
    public void ResolveConnection_keeps_explicit_value()
    {
        var opts = new DatabaseOptions { ConnectionString = "explicit" };
        CliHostFactory.ResolveConnection(opts, Build());
        opts.ConnectionString.Should().Be("explicit");
    }

    [Fact]
    public void ResolveConnection_reads_connection_strings_section()
    {
        var opts = new DatabaseOptions();
        var cfg = Build(("ConnectionStrings:Saturdaze", "from-config"));
        using var _ = new EnvScope("SATURDAZE_CONNECTION", null);
        CliHostFactory.ResolveConnection(opts, cfg);
        opts.ConnectionString.Should().Be("from-config");
    }

    [Fact]
    public void ResolveConnection_reads_flat_setting()
    {
        var opts = new DatabaseOptions();
        var cfg = Build(("Saturdaze:ConnectionString", "flat"));
        using var _ = new EnvScope("SATURDAZE_CONNECTION", null);
        CliHostFactory.ResolveConnection(opts, cfg);
        opts.ConnectionString.Should().Be("flat");
    }

    [Fact]
    public void ResolveConnection_sqlite_default_points_to_user_scope_db()
    {
        var opts = new DatabaseOptions { Provider = DatabaseProvider.Sqlite };
        using var _ = new EnvScope("SATURDAZE_CONNECTION", null);
        CliHostFactory.ResolveConnection(opts, Build());
        opts.ConnectionString.Should().StartWith("Data Source=");
        opts.ConnectionString.Should().Contain("saturdaze.db");
    }

    [Fact]
    public void ResolveConnection_sqlserver_with_no_settings_leaves_blank()
    {
        var opts = new DatabaseOptions { Provider = DatabaseProvider.SqlServer };
        using var _ = new EnvScope("SATURDAZE_CONNECTION", null);
        CliHostFactory.ResolveConnection(opts, Build());
        opts.ConnectionString.Should().BeNullOrEmpty();
    }

    [Fact]
    public void ResolveConnection_reads_saturdaze_connection_env_var()
    {
        var opts = new DatabaseOptions { Provider = DatabaseProvider.SqlServer };
        using var _ = new EnvScope("SATURDAZE_CONNECTION", "from-env");
        CliHostFactory.ResolveConnection(opts, Build());
        opts.ConnectionString.Should().Be("from-env");
    }

    [Fact]
    public void ResolveConnection_env_var_loses_to_explicit_connection()
    {
        var opts = new DatabaseOptions { ConnectionString = "explicit", Provider = DatabaseProvider.SqlServer };
        using var _ = new EnvScope("SATURDAZE_CONNECTION", "from-env");
        CliHostFactory.ResolveConnection(opts, Build());
        opts.ConnectionString.Should().Be("explicit");
    }

    [Fact]
    public void ResolveConnection_env_var_wins_over_configuration()
    {
        // Same precedence as the API host (L2-043 AC3): the env var is the
        // deployment-time override, configuration is the checked-in default.
        var opts = new DatabaseOptions { Provider = DatabaseProvider.SqlServer };
        var cfg = Build(("ConnectionStrings:Saturdaze", "from-config"));
        using var _ = new EnvScope("SATURDAZE_CONNECTION", "from-env");
        CliHostFactory.ResolveConnection(opts, cfg);
        opts.ConnectionString.Should().Be("from-env");
    }

    [Fact]
    public void ResolveConnection_ignores_blank_configuration_values()
    {
        var opts = new DatabaseOptions { Provider = DatabaseProvider.SqlServer };
        var cfg = Build(("ConnectionStrings:Saturdaze", ""), ("Saturdaze:ConnectionString", "   "));
        using var _ = new EnvScope("SATURDAZE_CONNECTION", null);
        CliHostFactory.ResolveConnection(opts, cfg);
        opts.ConnectionString.Should().BeNullOrEmpty();
    }

    [Fact]
    public void Create_returns_builder()
    {
        var opts = new DatabaseOptions { Provider = DatabaseProvider.InMemory };
        var builder = CliHostFactory.Create(opts, verbose: true, args: Array.Empty<string>());
        builder.Should().NotBeNull();
    }

    private static IConfiguration Build(params (string Key, string Value)[] settings) =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(settings.Select(s =>
                new KeyValuePair<string, string?>(s.Key, s.Value)))
            .Build();

    private sealed class EnvScope : IDisposable
    {
        private readonly string _name;
        private readonly string? _prior;

        public EnvScope(string name, string? value)
        {
            _name = name;
            _prior = Environment.GetEnvironmentVariable(name);
            Environment.SetEnvironmentVariable(name, value);
        }

        public void Dispose() => Environment.SetEnvironmentVariable(_name, _prior);
    }
}
