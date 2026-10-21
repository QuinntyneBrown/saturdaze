using System.Collections.Concurrent;
using Saturdaze.Application.Calendar;

namespace Saturdaze.Api.Tests.Support;

/// <summary>
/// Stands in for Google's OAuth endpoints and Calendar API (ADR-020): codes map
/// to grants, and every revocation is recorded. Unmapped codes are refused, as
/// Google refuses a code it did not issue.
/// </summary>
public sealed class FakeGoogleCalendarClient : IGoogleCalendarClient
{
    public const string ClientId = "test-calendar-client.apps.googleusercontent.com";

    private readonly ConcurrentDictionary<string, GoogleCalendarGrant> _codes = new(StringComparer.Ordinal);

    public bool IsConfigured { get; set; } = true;

    /// <summary>When set, every call to Google fails as an outage would.</summary>
    public bool Unavailable { get; set; }

    /// <summary>When set, revocation fails (L2-167 AC2).</summary>
    public bool RevokeFails { get; set; }

    public ConcurrentQueue<string> Revoked { get; } = new();

    /// <summary>The redirect URIs codes were exchanged with.</summary>
    public ConcurrentQueue<string> ExchangedWith { get; } = new();

    /// <summary>Registers a code Google would accept and returns it; the grant's refresh token is unique.</summary>
    public string IssueCode(string email, bool calendarScope = true, string? subject = null)
    {
        var code = $"code-{Guid.NewGuid():N}";
        _codes[code] = new GoogleCalendarGrant(
            subject ?? $"sub-{Guid.NewGuid():N}", email, $"refresh-{Guid.NewGuid():N}", calendarScope);
        return code;
    }

    /// <summary>The refresh token a code's grant carries (to check it is never stored or shown).</summary>
    public string RefreshTokenFor(string code) => _codes[code].RefreshToken;

    public Uri AuthorizationUrl(string state, string redirectUri)
        => GoogleCalendarAuthorization.Url(ClientId, redirectUri, state);

    public Task<GoogleCalendarGrant> ExchangeCodeAsync(string code, string redirectUri, CancellationToken ct)
    {
        if (Unavailable) throw new GoogleCalendarUnavailableException("Google is down");
        ExchangedWith.Enqueue(redirectUri);
        return _codes.TryRemove(code, out var grant)
            ? Task.FromResult(grant)
            : throw new GoogleCalendarCodeRejectedException();
    }

    public Task RevokeAsync(string refreshToken, CancellationToken ct)
    {
        if (Unavailable || RevokeFails) throw new GoogleCalendarUnavailableException("revoke failed");
        Revoked.Enqueue(refreshToken);
        return Task.CompletedTask;
    }
}
