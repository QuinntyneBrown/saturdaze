namespace Saturdaze.Domain.Enums;

/// <summary>
/// Outcome of a single ingestion pass. Persisted as an int on
/// <see cref="Entities.IngestionRun"/>; values are stable and must not be
/// renumbered.
/// </summary>
public enum IngestionStatus
{
    /// <summary>The runner has opened the audit row but not yet finished.</summary>
    Running = 0,

    /// <summary>Every parsed row was upserted with no rejections.</summary>
    Succeeded = 1,

    /// <summary>Some rows were upserted; others were rejected (bad schema or constraint).</summary>
    PartialSuccess = 2,

    /// <summary>The pass failed before any rows could be written (e.g. the API call threw).</summary>
    Failed = 3
}
