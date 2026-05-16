using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Cli.Database;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Cli.Tests;

public class DbContextRegistrarTests
{
    private readonly DbContextRegistrar _sut = new();

    [Fact]
    public void Configures_sqlserver_with_connection()
    {
        var builder = new DbContextOptionsBuilder<AppDbContext>();
        _sut.Configure(builder, new DatabaseOptions
        {
            Provider = DatabaseProvider.SqlServer,
            ConnectionString = "Server=.;Database=x;Trusted_Connection=true"
        });

        builder.Options.Extensions.Should().Contain(e => e.GetType().Name.Contains("SqlServer"));
    }

    [Fact]
    public void Configures_sqlite_with_connection()
    {
        var builder = new DbContextOptionsBuilder<AppDbContext>();
        _sut.Configure(builder, new DatabaseOptions
        {
            Provider = DatabaseProvider.Sqlite,
            ConnectionString = "Data Source=:memory:"
        });

        builder.Options.Extensions.Should().Contain(e => e.GetType().Name.Contains("Sqlite"));
    }

    [Fact]
    public void Configures_inmemory_with_default_name()
    {
        var builder = new DbContextOptionsBuilder<AppDbContext>();
        _sut.Configure(builder, new DatabaseOptions { Provider = DatabaseProvider.InMemory });

        builder.Options.Extensions.Should().Contain(e => e.GetType().Name.Contains("InMemory"));
    }

    [Fact]
    public void Configures_inmemory_with_custom_name()
    {
        var builder = new DbContextOptionsBuilder<AppDbContext>();
        _sut.Configure(builder, new DatabaseOptions
        {
            Provider = DatabaseProvider.InMemory,
            ConnectionString = "my-db"
        });

        builder.Options.Extensions.Should().Contain(e => e.GetType().Name.Contains("InMemory"));
    }

    [Fact]
    public void Throws_when_sqlserver_connection_missing()
    {
        Action act = () => _sut.Configure(
            new DbContextOptionsBuilder<AppDbContext>(),
            new DatabaseOptions { Provider = DatabaseProvider.SqlServer });

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*requires a connection string*");
    }

    [Fact]
    public void Throws_when_sqlite_connection_missing()
    {
        Action act = () => _sut.Configure(
            new DbContextOptionsBuilder<AppDbContext>(),
            new DatabaseOptions { Provider = DatabaseProvider.Sqlite });

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Throws_on_unknown_provider()
    {
        Action act = () => _sut.Configure(
            new DbContextOptionsBuilder<AppDbContext>(),
            new DatabaseOptions { Provider = (DatabaseProvider)999 });

        act.Should().Throw<InvalidOperationException>().WithMessage("*Unknown provider*");
    }
}
