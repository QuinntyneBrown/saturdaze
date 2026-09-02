namespace Saturdaze.Cli.Seed;

/// <summary>
/// Decides which directory <c>saturdaze seed</c> reads its JSON from.
/// Precedence: <c>--seed-dir</c>, then <c>SATURDAZE_SEED_DIR</c>, then the
/// JSON bundled next to the tool. The per-user directory under
/// <c>%APPDATA%\saturdaze\seed</c> is only used when no bundle ships with
/// the install: preferring it silently pinned every developer to whatever
/// copy was made on first run, so seed changes in the repo never landed.
/// </summary>
public sealed class SeedPathResolver : ISeedPathResolver
{
    public const string FolderName = "saturdaze";
    public const string SeedSubfolder = "seed";

    private readonly Func<Environment.SpecialFolder, string> _specialFolder;
    private readonly Func<string, string?> _envVar;
    private readonly string _bundleDirectory;

    public SeedPathResolver()
        : this(Environment.GetFolderPath, Environment.GetEnvironmentVariable, DefaultBundleDirectory) { }

    internal SeedPathResolver(
        Func<Environment.SpecialFolder, string> specialFolder,
        Func<string, string?> envVar,
        string? bundleDirectory = null)
    {
        _specialFolder = specialFolder;
        _envVar = envVar;
        _bundleDirectory = bundleDirectory ?? DefaultBundleDirectory;
    }

    private static string DefaultBundleDirectory => Path.Combine(AppContext.BaseDirectory, "Seed", "Data");

    public string Resolve(string? overridePath)
    {
        if (!string.IsNullOrWhiteSpace(overridePath))
            return Path.GetFullPath(overridePath);

        var fromEnv = _envVar("SATURDAZE_SEED_DIR");
        if (!string.IsNullOrWhiteSpace(fromEnv))
            return Path.GetFullPath(fromEnv);

        if (Directory.Exists(_bundleDirectory))
            return Path.GetFullPath(_bundleDirectory);

        return UserScopeDirectory;
    }

    public string BundleDirectory => _bundleDirectory;

    /// <summary>Legacy per-user location, used only when the tool ships without bundled JSON.</summary>
    public string UserScopeDirectory
    {
        get
        {
            var appData = _specialFolder(Environment.SpecialFolder.ApplicationData);
            if (string.IsNullOrWhiteSpace(appData))
                appData = Path.Combine(_specialFolder(Environment.SpecialFolder.UserProfile), ".config");

            return Path.Combine(appData, FolderName, SeedSubfolder);
        }
    }
}
