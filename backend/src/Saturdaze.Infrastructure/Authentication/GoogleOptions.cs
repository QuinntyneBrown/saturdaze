namespace Saturdaze.Infrastructure.Authentication;

/// <summary>
/// Sign in with Google (ADR-019) and Google Calendar sync (ADR-021). Empty
/// <see cref="ClientId"/> turns both off; empty <see cref="ClientSecret"/> turns
/// calendar sync off.
/// </summary>
public class GoogleOptions
{
    public const string SectionName = "Saturdaze:Google";

    /// <summary>The OAuth client id the browser's Google button was created with; the ID token's audience.</summary>
    public string ClientId { get; set; } = string.Empty;

    /// <summary>The OAuth client's secret, for the calendar code exchange only; never sent to the browser.</summary>
    public string ClientSecret { get; set; } = string.Empty;
}
