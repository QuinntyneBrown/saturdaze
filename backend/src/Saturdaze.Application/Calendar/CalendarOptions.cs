namespace Saturdaze.Application.Calendar;

/// <summary>Calendar sync settings (ADR-021).</summary>
public sealed class CalendarOptions
{
    public const string SectionName = "Saturdaze:Calendar";

    /// <summary>Where the app runs; Google returns the browser to <see cref="RedirectUri"/> on it. Defaults to <c>Saturdaze:Share:AppOrigin</c>.</summary>
    public string? AppOrigin { get; set; }

    /// <summary>The time zone the weekend's local times are in (L2-175).</summary>
    public string TimeZone { get; set; } = "America/Toronto";

    /// <summary>How often the sync service looks for due work without a signal.</summary>
    public int PollSeconds { get; set; } = 60;

    /// <summary>Where the Data Protection key ring persists; empty keeps the default.</summary>
    public string? KeyDirectory { get; set; }

    public string RedirectUri => $"{(AppOrigin ?? string.Empty).TrimEnd('/')}/family/calendar/google";
}
