namespace Saturdaze.Application.PhotoSuggestions;

/// <summary>Photo suggestion limits (L2-157), bound from <c>Saturdaze:PhotoSuggestions</c>.</summary>
public sealed class PhotoSuggestionOptions
{
    public const string SectionName = "Saturdaze:PhotoSuggestions";

    /// <summary>How many candidates Claude is asked for, and the most that are fetched.</summary>
    public int MaxCandidates { get; set; } = 6;

    /// <summary>How long a suggestion and its preview stay available.</summary>
    public int LifetimeMinutes { get; set; } = 15;

    /// <summary>Searches one user may run in a rolling hour (AC7).</summary>
    public int SearchesPerHour { get; set; } = 20;

    /// <summary>Length cap on the refinement or description query.</summary>
    public const int MaxQueryLength = 120;

    /// <summary>Shortest description accepted for a profile photo search.</summary>
    public const int MinQueryLength = 3;
}
