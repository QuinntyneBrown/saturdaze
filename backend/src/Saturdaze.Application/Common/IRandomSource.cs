namespace Saturdaze.Application.Common;

/// <summary>
/// Seam over <see cref="Random"/> so the planner's stochastic decisions are deterministic in tests.
/// The planner injects this — never <c>new Random()</c>.
/// </summary>
public interface IRandomSource
{
    int Next(int maxExclusive);
}

public sealed class SeededRandomSource : IRandomSource
{
    private readonly Random _rng;
    public SeededRandomSource(int seed) => _rng = new Random(seed);
    public int Next(int maxExclusive) => _rng.Next(maxExclusive);
}
