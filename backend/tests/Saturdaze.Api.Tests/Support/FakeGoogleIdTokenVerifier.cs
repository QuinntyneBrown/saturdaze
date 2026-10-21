using Saturdaze.Application.Authentication;

namespace Saturdaze.Api.Tests.Support;

/// <summary>
/// Stands in for Google: maps credential strings to the identity Google would
/// have signed. Anything unmapped verifies as <c>null</c>, which is how the
/// real verifier reports a bad signature, audience or expiry (ADR-019).
/// </summary>
public sealed class FakeGoogleIdTokenVerifier : IGoogleIdTokenVerifier
{
    public Dictionary<string, GoogleIdentity> Credentials { get; } = new(StringComparer.Ordinal);

    public bool IsConfigured { get; set; } = true;

    public Task<GoogleIdentity?> VerifyAsync(string idToken, CancellationToken ct)
        => Task.FromResult(Credentials.TryGetValue(idToken, out var identity) ? identity : null);

    /// <summary>Registers a credential and returns it, so a test reads as one line per Google account.</summary>
    public string Issue(string subject, string email, bool emailVerified = true)
    {
        var credential = $"google-{subject}-{Guid.NewGuid():N}";
        Credentials[credential] = new GoogleIdentity(subject, email, emailVerified);
        return credential;
    }
}
