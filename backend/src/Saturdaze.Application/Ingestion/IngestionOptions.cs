namespace Saturdaze.Application.Ingestion;

/// <summary>
/// Application-level ingestion knobs (bound from <c>Saturdaze:Ingestion</c>).
/// Provider-specific settings (API key, model, search budget) live in the
/// Infrastructure-layer options class so this layer stays free of any
/// provider concern.
/// </summary>
public sealed class IngestionOptions
{
    public const string SectionName = "Saturdaze:Ingestion";

    /// <summary>How far the family will drive, in minutes. Bounds the search.</summary>
    public int MaxDriveMinutes { get; set; } = 200;

    /// <summary>
    /// Cost circuit-breaker: the runner refuses to start a new pass for a type
    /// once this many runs already exist for the current UTC day. Stops a
    /// misconfigured trigger from running up an unbounded API bill. Generous by
    /// default so it never bites a normal daily/weekly cadence.
    /// </summary>
    public int MaxRunsPerDayPerType { get; set; } = 48;
}
