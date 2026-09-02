namespace Saturdaze.Cli.Reset;

/// <summary>
/// L2-045 AC3: a reset against a Production-configured host is refused unless
/// the operator passes <c>--allow-production</c>.
/// </summary>
public static class ResetGuard
{
    public const int BlockedExitCode = 5;

    public static bool IsProductionBlocked(string? environmentName, bool allowProduction)
        => !allowProduction
           && string.Equals(environmentName?.Trim(), "Production", StringComparison.OrdinalIgnoreCase);

    public static string? CurrentEnvironmentName()
        => Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
           ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
}
