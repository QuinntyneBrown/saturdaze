namespace Saturdaze.Cli.Database;

/// <summary>Strips credential fragments before a connection string is logged.</summary>
public static class ConnectionStringSanitizer
{
    public static string Sanitize(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString)) return "(provider default)";
        var parts = connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries);
        return string.Join(';', parts.Where(p =>
            !p.TrimStart().StartsWith("Password", StringComparison.OrdinalIgnoreCase) &&
            !p.TrimStart().StartsWith("Pwd", StringComparison.OrdinalIgnoreCase)));
    }
}
