namespace Saturdaze.Application.Authentication;

/// <summary>What a verified Google ID token says about the person (L2-163).</summary>
/// <param name="Subject">Google's stable account id (<c>sub</c>).</param>
/// <param name="Email">The account's email address.</param>
/// <param name="EmailVerified">Whether Google has verified that address.</param>
public sealed record GoogleIdentity(string Subject, string Email, bool EmailVerified);

/// <summary>
/// Verifies a Google ID token (the "credential" Google Identity Services hands
/// the browser) against Google's published signing keys, issuer, the configured
/// client id and the expiry (ADR-019).
/// </summary>
public interface IGoogleIdTokenVerifier
{
    /// <summary>False when no client id is configured; sign in with Google is then off.</summary>
    bool IsConfigured { get; }

    /// <summary>The identity the token carries, or null when it fails any check.</summary>
    Task<GoogleIdentity?> VerifyAsync(string idToken, CancellationToken ct);
}
