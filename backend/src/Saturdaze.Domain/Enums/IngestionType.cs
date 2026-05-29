namespace Saturdaze.Domain.Enums;

/// <summary>
/// Which catalog a single ingestion pass targets. Persisted as an int on
/// <see cref="Entities.IngestionRun"/>; values are stable and must not be
/// renumbered.
/// </summary>
public enum IngestionType
{
    Events = 0,
    Activities = 1,
    Restaurants = 2
}
