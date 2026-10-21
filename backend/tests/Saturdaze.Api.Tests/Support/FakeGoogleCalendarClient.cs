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

    /// <summary>When set, revocation fails (L2-174 AC2).</summary>
    public bool RevokeFails { get; set; }

    public ConcurrentQueue<string> Revoked { get; } = new();

    /// <summary>Refresh tokens Google now refuses with <c>invalid_grant</c> (L2-177).</summary>
    public ConcurrentDictionary<string, bool> RevokedGrants { get; } = new(StringComparer.Ordinal);

    /// <summary>Each account's primary calendar, by refresh token: event id → event.</summary>
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, FakeEvent>> _calendars = new(StringComparer.Ordinal);

    /// <summary>Which refresh token belongs to which account email.</summary>
    private readonly ConcurrentDictionary<string, string> _tokensByEmail = new(StringComparer.OrdinalIgnoreCase);

    /// <summary>Every Calendar API call made, as "insert"/"update"/"delete"/"list" with the account's email.</summary>
    public ConcurrentQueue<(string Call, string Email)> Calls { get; } = new();

    public sealed record FakeEvent(string Id, GoogleCalendarEventWrite Event, int Version);

    /// <summary>Events the person keeps in their calendar, by refresh token (the read direction, L2-176).</summary>
    private readonly ConcurrentDictionary<string, ConcurrentQueue<GoogleCalendarEvent>> _ownEvents = new(StringComparer.Ordinal);

    /// <summary>How long a list call takes, to stand in for a slow Google (L2-177 AC2).</summary>
    public TimeSpan ListDelay { get; set; } = TimeSpan.Zero;

    /// <summary>The redirect URIs codes were exchanged with.</summary>
    public ConcurrentQueue<string> ExchangedWith { get; } = new();

    /// <summary>Registers a code Google would accept and returns it; the grant's refresh token is unique.</summary>
    public string IssueCode(string email, bool calendarScope = true, string? subject = null)
    {
        var code = $"code-{Guid.NewGuid():N}";
        var refreshToken = $"refresh-{Guid.NewGuid():N}";
        _codes[code] = new GoogleCalendarGrant(subject ?? $"sub-{Guid.NewGuid():N}", email, refreshToken, calendarScope);
        _tokensByEmail[email] = refreshToken;
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

    /// <summary>The events Saturdaze has written to an account's calendar.</summary>
    public IReadOnlyList<FakeEvent> EventsOf(string email)
        => _tokensByEmail.TryGetValue(email, out var token) && _calendars.TryGetValue(token, out var calendar)
            ? calendar.Values.OrderBy(e => e.Event.Start).ToList()
            : Array.Empty<FakeEvent>();

    /// <summary>Deletes an event as the person would in Google Calendar.</summary>
    public void DeleteInGoogle(string email, string eventId) => _calendars[_tokensByEmail[email]].TryRemove(eventId, out _);

    /// <summary>Makes Google refuse the account's grant from now on.</summary>
    public void RevokeInGoogle(string email) => RevokedGrants[_tokensByEmail[email]] = true;

    /// <summary>Waits until <paramref name="condition"/> holds for the account's events.</summary>
    public async Task<IReadOnlyList<FakeEvent>> WaitForEventsAsync(
        string email, Func<IReadOnlyList<FakeEvent>, bool> condition, int timeoutMs = 10_000)
    {
        var deadline = DateTime.UtcNow.AddMilliseconds(timeoutMs);
        while (DateTime.UtcNow < deadline)
        {
            var events = EventsOf(email);
            if (condition(events)) return events;
            await Task.Delay(50);
        }
        return EventsOf(email);
    }

    public int CallsFor(string email) => Calls.Count(c => string.Equals(c.Email, email, StringComparison.OrdinalIgnoreCase));

    private ConcurrentDictionary<string, FakeEvent> Calendar(string refreshToken, string call)
    {
        if (Unavailable) throw new GoogleCalendarUnavailableException("Google is down");
        if (RevokedGrants.ContainsKey(refreshToken)) throw new GoogleCalendarGrantRevokedException();
        var email = _tokensByEmail.FirstOrDefault(kv => kv.Value == refreshToken).Key ?? "unknown";
        Calls.Enqueue((call, email));
        return _calendars.GetOrAdd(refreshToken, _ => new ConcurrentDictionary<string, FakeEvent>(StringComparer.Ordinal));
    }

    public Task<string> InsertEventAsync(string refreshToken, GoogleCalendarEventWrite write, CancellationToken ct)
    {
        var id = $"ev{Guid.NewGuid():N}";
        Calendar(refreshToken, "insert")[id] = new FakeEvent(id, write, 1);
        return Task.FromResult(id);
    }

    public Task<bool> UpdateEventAsync(string refreshToken, string eventId, GoogleCalendarEventWrite write, CancellationToken ct)
    {
        var calendar = Calendar(refreshToken, "update");
        if (!calendar.TryGetValue(eventId, out var existing)) return Task.FromResult(false);
        calendar[eventId] = existing with { Event = write, Version = existing.Version + 1 };
        return Task.FromResult(true);
    }

    public Task DeleteEventAsync(string refreshToken, string eventId, CancellationToken ct)
    {
        Calendar(refreshToken, "delete").TryRemove(eventId, out _);
        return Task.CompletedTask;
    }

    /// <summary>Puts an event in the account's calendar as the person would.</summary>
    public void AddOwnEvent(string email, GoogleCalendarEvent ev)
        => _ownEvents.GetOrAdd(_tokensByEmail[email], _ => new ConcurrentQueue<GoogleCalendarEvent>()).Enqueue(ev);

    public async Task<IReadOnlyList<GoogleCalendarEvent>> ListEventsAsync(
        string refreshToken, DateTimeOffset from, DateTimeOffset to, CancellationToken ct)
    {
        if (ListDelay > TimeSpan.Zero) await Task.Delay(ListDelay, ct);
        var written = Calendar(refreshToken, "list").Values.Select(e => new GoogleCalendarEvent(
            e.Id, e.Event.Summary,
            new DateTimeOffset(e.Event.Start, TimeSpan.FromHours(-4)), new DateTimeOffset(e.Event.End, TimeSpan.FromHours(-4)),
            AllDay: false, Cancelled: false, Declined: false, Free: false, WrittenBySaturdaze: true));
        var own = _ownEvents.TryGetValue(refreshToken, out var q) ? q.ToArray() : Array.Empty<GoogleCalendarEvent>();
        return own.Concat(written)
            .Where(e => e.AllDay || (e.End > from && e.Start < to))
            .ToList();
    }
}
