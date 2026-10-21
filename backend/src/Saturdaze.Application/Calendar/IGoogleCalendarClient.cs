namespace Saturdaze.Application.Calendar;

/// <summary>
/// Google's OAuth 2.0 endpoints and Calendar API as calendar sync needs them
/// (ADR-020). Calls fail with <see cref="GoogleCalendarCodeRejectedException"/>,
/// <see cref="GoogleCalendarGrantRevokedException"/> or
/// <see cref="GoogleCalendarUnavailableException"/>.
/// </summary>
public interface IGoogleCalendarClient
{
    /// <summary>False when the client id or the client secret is empty; the feature is then off.</summary>
    bool IsConfigured { get; }

    /// <summary>Google's consent screen for this client, the redirect URI and the state.</summary>
    Uri AuthorizationUrl(string state, string redirectUri);

    /// <summary>Exchanges an authorization code for a grant with a refresh token.</summary>
    Task<GoogleCalendarGrant> ExchangeCodeAsync(string code, string redirectUri, CancellationToken ct);

    /// <summary>Revokes a refresh token at Google.</summary>
    Task RevokeAsync(string refreshToken, CancellationToken ct);

    /// <summary>Adds an event to the account's primary calendar; returns the id Google assigned.</summary>
    Task<string> InsertEventAsync(string refreshToken, GoogleCalendarEventWrite write, CancellationToken ct);

    /// <summary>Replaces an event; false when the person deleted it in Google (404/410).</summary>
    Task<bool> UpdateEventAsync(string refreshToken, string eventId, GoogleCalendarEventWrite write, CancellationToken ct);

    /// <summary>Deletes an event; one already gone counts as deleted.</summary>
    Task DeleteEventAsync(string refreshToken, string eventId, CancellationToken ct);
}

/// <summary>
/// One block as a Google event (L2-168): local start and end in <see cref="TimeZone"/>,
/// and the block id as a private extended property so the read direction skips it.
/// </summary>
public sealed record GoogleCalendarEventWrite(
    Guid BlockId,
    string Summary,
    string Description,
    string? Location,
    DateTime Start,
    DateTime End,
    string TimeZone);

/// <summary>What a code exchange yields: the Google account and its refresh token.</summary>
public sealed record GoogleCalendarGrant(string Subject, string Email, string RefreshToken, bool HasCalendarScope);

/// <summary>Google refused the authorization code (expired, used, or not issued for this client).</summary>
public sealed class GoogleCalendarCodeRejectedException : Exception
{
    public GoogleCalendarCodeRejectedException() : base("Google refused the authorization code.") { }
}

/// <summary>Google reports the grant as expired or revoked (<c>invalid_grant</c>).</summary>
public sealed class GoogleCalendarGrantRevokedException : Exception
{
    public GoogleCalendarGrantRevokedException() : base("The Google grant is expired or revoked.") { }
}

/// <summary>Google could not be reached or answered unexpectedly.</summary>
public sealed class GoogleCalendarUnavailableException : Exception
{
    public GoogleCalendarUnavailableException(string message, Exception? inner = null) : base(message, inner) { }
}
