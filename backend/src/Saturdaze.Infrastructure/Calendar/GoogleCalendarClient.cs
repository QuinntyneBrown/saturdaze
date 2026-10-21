using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Calendar;
using Saturdaze.Infrastructure.Authentication;

namespace Saturdaze.Infrastructure.Calendar;

/// <summary>
/// Google's OAuth 2.0 token and revocation endpoints and the Calendar API v3
/// (ADR-020). Access tokens are refreshed from the stored refresh token and
/// cached in memory for their lifetime less a minute; they are never stored.
/// </summary>
public sealed class GoogleCalendarClient : IGoogleCalendarClient
{
    public const string HttpClientName = "google-calendar";
    public const string TokenEndpoint = "https://oauth2.googleapis.com/token";
    public const string RevokeEndpoint = "https://oauth2.googleapis.com/revoke";
    public const string CalendarApi = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

    private readonly IHttpClientFactory _http;
    private readonly IMemoryCache _cache;
    private readonly GoogleOptions _options;

    public GoogleCalendarClient(IHttpClientFactory http, IMemoryCache cache, IOptions<GoogleOptions> options)
    {
        _http = http;
        _cache = cache;
        _options = options.Value;
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_options.ClientId) && !string.IsNullOrWhiteSpace(_options.ClientSecret);

    public Uri AuthorizationUrl(string state, string redirectUri)
        => GoogleCalendarAuthorization.Url(_options.ClientId, redirectUri, state);

    public async Task<GoogleCalendarGrant> ExchangeCodeAsync(string code, string redirectUri, CancellationToken ct)
    {
        using var response = await SendAsync(new HttpRequestMessage(HttpMethod.Post, TokenEndpoint)
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["code"] = code,
                ["client_id"] = _options.ClientId,
                ["client_secret"] = _options.ClientSecret,
                ["redirect_uri"] = redirectUri,
                ["grant_type"] = "authorization_code",
            }),
        }, ct);
        var body = await ReadJsonAsync(response, ct);
        if (response.StatusCode == HttpStatusCode.BadRequest && ErrorOf(body) == "invalid_grant")
            throw new GoogleCalendarCodeRejectedException();
        if (!response.IsSuccessStatusCode)
            throw new GoogleCalendarUnavailableException($"Token endpoint answered {(int)response.StatusCode}");

        var refreshToken = String(body, "refresh_token")
            ?? throw new GoogleCalendarUnavailableException("No refresh token in the grant");
        var scopes = (String(body, "scope") ?? string.Empty).Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var (subject, email) = Identity(String(body, "id_token"));
        CacheAccessToken(refreshToken, body);
        return new GoogleCalendarGrant(subject, email, refreshToken,
            scopes.Contains(GoogleCalendarAuthorization.CalendarScope, StringComparer.Ordinal));
    }

    public async Task RevokeAsync(string refreshToken, CancellationToken ct)
    {
        using var response = await SendAsync(new HttpRequestMessage(HttpMethod.Post, RevokeEndpoint)
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string> { ["token"] = refreshToken }),
        }, ct);
        _cache.Remove(CacheKey(refreshToken));
        // 400 means Google no longer knows the token: it is as revoked as it gets.
        if (!response.IsSuccessStatusCode && response.StatusCode != HttpStatusCode.BadRequest)
            throw new GoogleCalendarUnavailableException($"Revocation answered {(int)response.StatusCode}");
    }

    public async Task<IReadOnlyList<GoogleCalendarEvent>> ListEventsAsync(
        string refreshToken, DateTimeOffset from, DateTimeOffset to, CancellationToken ct)
    {
        var events = new List<GoogleCalendarEvent>();
        string? page = null;
        do
        {
            var url = $"{CalendarApi}?singleEvents=true&orderBy=startTime&maxResults=250"
                + $"&timeMin={Uri.EscapeDataString(from.ToString("yyyy-MM-dd'T'HH:mm:sszzz"))}"
                + $"&timeMax={Uri.EscapeDataString(to.ToString("yyyy-MM-dd'T'HH:mm:sszzz"))}"
                + (page is null ? string.Empty : $"&pageToken={Uri.EscapeDataString(page)}");
            using var response = await CalendarAsync(refreshToken, HttpMethod.Get, url, null, ct);
            var body = await ReadJsonAsync(response, ct);
            if (!response.IsSuccessStatusCode)
                throw new GoogleCalendarUnavailableException($"List answered {(int)response.StatusCode}");
            if (body.TryGetProperty("items", out var items) && items.ValueKind == JsonValueKind.Array)
                events.AddRange(items.EnumerateArray().Select(ReadEvent));
            page = String(body, "nextPageToken");
        } while (page is not null);
        return events;
    }

    private static GoogleCalendarEvent ReadEvent(JsonElement item)
    {
        static (DateTimeOffset? At, bool AllDay) When(JsonElement item, string name)
        {
            if (!item.TryGetProperty(name, out var when)) return (null, false);
            if (String(when, "dateTime") is { } dateTime && DateTimeOffset.TryParse(dateTime, out var at)) return (at, false);
            return (null, String(when, "date") is not null);
        }

        var (start, allDay) = When(item, "start");
        var (end, _) = When(item, "end");
        var declined = item.TryGetProperty("attendees", out var attendees) && attendees.ValueKind == JsonValueKind.Array
            && attendees.EnumerateArray().Any(a =>
                a.TryGetProperty("self", out var self) && self.ValueKind == JsonValueKind.True
                && String(a, "responseStatus") == "declined");
        var ours = item.TryGetProperty("extendedProperties", out var ext)
            && ext.TryGetProperty("private", out var priv)
            && priv.TryGetProperty(SaturdazeBlockProperty, out _);
        return new GoogleCalendarEvent(
            String(item, "id") ?? string.Empty,
            String(item, "summary"),
            start,
            end,
            allDay,
            Cancelled: String(item, "status") == "cancelled",
            Declined: declined,
            Free: String(item, "transparency") == "transparent",
            WrittenBySaturdaze: ours);
    }

    public async Task<string> InsertEventAsync(string refreshToken, GoogleCalendarEventWrite write, CancellationToken ct)
    {
        using var response = await CalendarAsync(refreshToken, HttpMethod.Post, CalendarApi, Body(write), ct);
        var body = await ReadJsonAsync(response, ct);
        if (!response.IsSuccessStatusCode)
            throw new GoogleCalendarUnavailableException($"Insert answered {(int)response.StatusCode}");
        return String(body, "id") ?? throw new GoogleCalendarUnavailableException("No event id");
    }

    public async Task<bool> UpdateEventAsync(
        string refreshToken, string eventId, GoogleCalendarEventWrite write, CancellationToken ct)
    {
        using var response = await CalendarAsync(
            refreshToken, HttpMethod.Put, $"{CalendarApi}/{Uri.EscapeDataString(eventId)}", Body(write), ct);
        if (response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Gone) return false;
        if (!response.IsSuccessStatusCode)
            throw new GoogleCalendarUnavailableException($"Update answered {(int)response.StatusCode}");
        // An event deleted in Google stays as "cancelled" for a while and still updates; treat it as gone.
        return String(await ReadJsonAsync(response, ct), "status") != "cancelled";
    }

    public async Task DeleteEventAsync(string refreshToken, string eventId, CancellationToken ct)
    {
        using var response = await CalendarAsync(
            refreshToken, HttpMethod.Delete, $"{CalendarApi}/{Uri.EscapeDataString(eventId)}", null, ct);
        if (!response.IsSuccessStatusCode
            && response.StatusCode is not (HttpStatusCode.NotFound or HttpStatusCode.Gone))
            throw new GoogleCalendarUnavailableException($"Delete answered {(int)response.StatusCode}");
    }

    /// <summary>A Calendar API call with a fresh bearer; a 401 refreshes it once.</summary>
    private async Task<HttpResponseMessage> CalendarAsync(
        string refreshToken, HttpMethod method, string url, object? body, CancellationToken ct)
    {
        for (var attempt = 0; ; attempt++)
        {
            var request = new HttpRequestMessage(method, url);
            request.Headers.Authorization = new("Bearer", await AccessTokenAsync(refreshToken, ct));
            if (body is not null)
                request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
            var response = await SendAsync(request, ct);
            if (response.StatusCode != HttpStatusCode.Unauthorized || attempt > 0) return response;
            response.Dispose();
            _cache.Remove(CacheKey(refreshToken));
        }
    }

    /// <summary>The Calendar API's event resource for one block (L2-168).</summary>
    private static object Body(GoogleCalendarEventWrite write) => new Dictionary<string, object?>
    {
        ["summary"] = write.Summary,
        ["description"] = write.Description,
        ["location"] = write.Location,
        ["start"] = new { dateTime = write.Start.ToString("yyyy-MM-dd'T'HH:mm:ss"), timeZone = write.TimeZone },
        ["end"] = new { dateTime = write.End.ToString("yyyy-MM-dd'T'HH:mm:ss"), timeZone = write.TimeZone },
        ["status"] = "confirmed",
        ["extendedProperties"] = new
        {
            @private = new Dictionary<string, string> { [SaturdazeBlockProperty] = write.BlockId.ToString() },
        },
    };

    /// <summary>The private extended property that marks an event Saturdaze wrote.</summary>
    public const string SaturdazeBlockProperty = "saturdazeBlock";

    /// <summary>A bearer for the Calendar API, refreshed when the cached one is gone.</summary>
    internal async Task<string> AccessTokenAsync(string refreshToken, CancellationToken ct)
    {
        if (_cache.TryGetValue<string>(CacheKey(refreshToken), out var cached) && cached is not null) return cached;

        using var response = await SendAsync(new HttpRequestMessage(HttpMethod.Post, TokenEndpoint)
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["refresh_token"] = refreshToken,
                ["client_id"] = _options.ClientId,
                ["client_secret"] = _options.ClientSecret,
                ["grant_type"] = "refresh_token",
            }),
        }, ct);
        var body = await ReadJsonAsync(response, ct);
        if (response.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.Unauthorized
            && ErrorOf(body) is "invalid_grant" or "unauthorized_client")
            throw new GoogleCalendarGrantRevokedException();
        if (!response.IsSuccessStatusCode)
            throw new GoogleCalendarUnavailableException($"Token refresh answered {(int)response.StatusCode}");
        return CacheAccessToken(refreshToken, body)
            ?? throw new GoogleCalendarUnavailableException("No access token in the refresh");
    }

    internal async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        try
        {
            return await _http.CreateClient(HttpClientName).SendAsync(request, ct);
        }
        catch (HttpRequestException ex)
        {
            throw new GoogleCalendarUnavailableException("Google could not be reached", ex);
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            throw new GoogleCalendarUnavailableException("Google timed out", ex);
        }
    }

    internal static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response, CancellationToken ct)
    {
        var text = await response.Content.ReadAsStringAsync(ct);
        if (string.IsNullOrWhiteSpace(text)) return default;
        try
        {
            return JsonDocument.Parse(text).RootElement.Clone();
        }
        catch (JsonException)
        {
            return default;
        }
    }

    internal static string? String(JsonElement body, string name)
        => body.ValueKind == JsonValueKind.Object && body.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String
            ? v.GetString()
            : null;

    private static string? ErrorOf(JsonElement body) => String(body, "error");

    private string? CacheAccessToken(string refreshToken, JsonElement body)
    {
        var accessToken = String(body, "access_token");
        if (accessToken is null) return null;
        var seconds = body.TryGetProperty("expires_in", out var e) && e.TryGetInt32(out var s) ? s : 3600;
        _cache.Set(CacheKey(refreshToken), accessToken, TimeSpan.FromSeconds(Math.Max(60, seconds - 60)));
        return accessToken;
    }

    private static string CacheKey(string refreshToken)
        => "google-calendar-access:" + Convert.ToHexString(
            System.Security.Cryptography.SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken)));

    /// <summary>
    /// The Google account in the ID token the token endpoint returned over TLS.
    /// OpenID Connect lets a client that received it directly from the token
    /// endpoint skip the signature check.
    /// </summary>
    private static (string Subject, string Email) Identity(string? idToken)
    {
        var parts = idToken?.Split('.');
        if (parts is not { Length: 3 }) throw new GoogleCalendarUnavailableException("No ID token in the grant");
        var payload = parts[1].Replace('-', '+').Replace('_', '/');
        payload = payload.PadRight(payload.Length + (4 - payload.Length % 4) % 4, '=');
        var claims = JsonDocument.Parse(Convert.FromBase64String(payload)).RootElement;
        return (String(claims, "sub") ?? string.Empty, String(claims, "email") ?? string.Empty);
    }
}
