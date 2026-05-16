using System.Diagnostics;

namespace Saturdaze.Api.Tests.Support;

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
            RedirectStandardOutput = true, UseShellExecute = false, CreateNoWindow = true
        };
        using var p = Process.Start(psi)
            ?? throw new InvalidOperationException("Could not start sqllocaldb.");

        string? pipe = null;
        while (!p.StandardOutput.EndOfStream)
        {
            var line = p.StandardOutput.ReadLine();
            if (line is not null && line.StartsWith("Instance pipe name:"))
                pipe = line["Instance pipe name:".Length..].Trim();
        }
        p.WaitForExit();

        if (string.IsNullOrEmpty(pipe))
        {
            using var start = Process.Start(new ProcessStartInfo("sqllocaldb", $"start {Instance}")
            { CreateNoWindow = true, UseShellExecute = false });
            start?.WaitForExit();
            return ResolvePipe();
        }

        _pipe = pipe;
        return _pipe;
    }
}
