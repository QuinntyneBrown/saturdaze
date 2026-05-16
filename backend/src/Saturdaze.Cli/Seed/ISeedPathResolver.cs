namespace Saturdaze.Cli.Seed;

public interface ISeedPathResolver
{
    string Resolve(string? overridePath);

    /// <summary>
    /// Directory containing seed JSONs shipped with the CLI binary. Used to
    /// populate an empty user-scope directory on first run. Returns the path
    /// even if it does not exist; callers check existence.
    /// </summary>
    string BundleDirectory { get; }
}
