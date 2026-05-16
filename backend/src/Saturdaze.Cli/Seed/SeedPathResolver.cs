namespace Saturdaze.Cli.Seed;

public sealed class SeedPathResolver : ISeedPathResolver
{
    public const string FolderName = "saturdaze";
    public const string SeedSubfolder = "seed";

    private readonly Func<Environment.SpecialFolder, string> _specialFolder;
    private readonly Func<string, string?> _envVar;

    public SeedPathResolver()
        : this(Environment.GetFolderPath, Environment.GetEnvironmentVariable) { }

    internal SeedPathResolver(
        Func<Environment.SpecialFolder, string> specialFolder,
        Func<string, string?> envVar)
    {
        _specialFolder = specialFolder;
        _envVar = envVar;
    }

    public string Resolve(string? overridePath)
    {
        if (!string.IsNullOrWhiteSpace(overridePath))
            return Path.GetFullPath(overridePath);

        var fromEnv = _envVar("SATURDAZE_SEED_DIR");
        if (!string.IsNullOrWhiteSpace(fromEnv))
            return Path.GetFullPath(fromEnv);

        var appData = _specialFolder(Environment.SpecialFolder.ApplicationData);
        if (string.IsNullOrWhiteSpace(appData))
            appData = Path.Combine(_specialFolder(Environment.SpecialFolder.UserProfile), ".config");

        return Path.Combine(appData, FolderName, SeedSubfolder);
    }

    public string BundleDirectory => Path.Combine(AppContext.BaseDirectory, "Seed", "Data");
}
