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
