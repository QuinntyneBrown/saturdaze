namespace Saturdaze.Infrastructure.Authentication;

/// <summary>Sign in with Google (ADR-019). Empty <see cref="ClientId"/> turns the feature off.</summary>
public class GoogleOptions
{
    public const string SectionName = "Saturdaze:Google";

    /// <summary>The OAuth client id the browser's Google button was created with; the ID token's audience.</summary>
    public string ClientId { get; set; } = string.Empty;
}
