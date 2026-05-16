using System.Diagnostics;

namespace Saturdaze.Infrastructure.Tests.Support;

/// <summary>
/// Resolves a LocalDB connection string via named pipe. Works around a known issue
/// where the `(localdb)\Instance` shortcut fails to load SqlUserInstance.dll on
/// LocalDB v17 / SQL Server 2025.
/// </summary>
public static class LocalDbConnection
{
    private const string Instance = "MSSQLLocalDB";
    private static string? _pipe;

    public static string For(string database)
    {
        var pipe = ResolvePipe();
        return $"Server={pipe};Database={database};Trusted_Connection=True;TrustServerCertificate=True;Connect Timeout=30";
    }

    public static string Master() => For("master");

    private static string ResolvePipe()
    {
        if (_pipe is not null) return _pipe;

        var psi = new ProcessStartInfo("sqllocaldb", $"info {Instance}")
        {
            RedirectStandardOutput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        using var p = Process.Start(psi)
            ?? throw new InvalidOperationException("Could not start sqllocaldb.");

        string? pipe = null;
        bool started = false;
        while (!p.StandardOutput.EndOfStream)
        {
            var line = p.StandardOutput.ReadLine();
            if (line is null) continue;
            if (line.StartsWith("State:") && line.Contains("Running")) started = true;
            if (line.StartsWith("Instance pipe name:"))
            {
                pipe = line["Instance pipe name:".Length..].Trim();
            }
        }
        p.WaitForExit();

        if (!started || string.IsNullOrEmpty(pipe))
        {
            // Try to start it then re-read.
            var start = Process.Start(new ProcessStartInfo("sqllocaldb", $"start {Instance}") { CreateNoWindow = true, UseShellExecute = false });
            start?.WaitForExit();
            return ResolvePipeInner();
        }

        _pipe = pipe;
        return _pipe;
    }

    private static string ResolvePipeInner()
    {
        var psi = new ProcessStartInfo("sqllocaldb", $"info {Instance}")
        {
            RedirectStandardOutput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        using var p = Process.Start(psi)!;
        string? pipe = null;
        while (!p.StandardOutput.EndOfStream)
        {
            var line = p.StandardOutput.ReadLine();
            if (line is not null && line.StartsWith("Instance pipe name:"))
                pipe = line["Instance pipe name:".Length..].Trim();
        }
        p.WaitForExit();
        _pipe = pipe ?? throw new InvalidOperationException("Could not resolve LocalDB pipe.");
        return _pipe;
    }
}
