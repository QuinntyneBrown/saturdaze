namespace Saturdaze.Worker;

/// <summary>
/// Controls when the Worker triggers ingestion (bound from
/// <c>Saturdaze:Ingestion:Schedule</c>). The default cron fires Fridays at
/// 08:00 UTC — the morning before the Friday-6pm weekend plan.
/// </summary>
public sealed class IngestionScheduleOptions
{
    public const string SectionName = "Saturdaze:Ingestion:Schedule";

    /// <summary>Master switch. When false the Worker idles and never ingests.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>5- or 6-field cron expression, evaluated in UTC.</summary>
    public string Cron { get; set; } = "0 0 8 * * 5";

    /// <summary>Which catalogs to refresh: <c>all</c> or a list of events/activities/restaurants.</summary>
    public string Types { get; set; } = "all";

    /// <summary>Run one pass immediately on startup (handy for first deploys and local checks).</summary>
    public bool RunOnStartup { get; set; }

    /// <summary>
    /// Run exactly one pass and then exit. Lets the same binary serve as a
    /// container "cron job" (Kubernetes CronJob / Azure Container Apps Job)
    /// where the scheduler is external and the process is expected to terminate.
    /// </summary>
    public bool RunOnceThenExit { get; set; }
}
