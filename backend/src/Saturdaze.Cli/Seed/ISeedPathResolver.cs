namespace Saturdaze.Cli.Seed;

public interface ISeedPathResolver
{
    string Resolve(string? overridePath);
}
