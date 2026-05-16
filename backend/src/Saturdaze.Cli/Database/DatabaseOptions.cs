namespace Saturdaze.Cli.Database;

public sealed class DatabaseOptions
{
    public DatabaseProvider Provider { get; set; } = DatabaseProvider.SqlServer;
    public string? ConnectionString { get; set; }
}
