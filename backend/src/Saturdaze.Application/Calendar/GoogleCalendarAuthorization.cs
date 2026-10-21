namespace Saturdaze.Application.Calendar;

/// <summary>Google's consent URL for calendar sync (L2-173): offline access, the calendar events scope only.</summary>
public static class GoogleCalendarAuthorization
{
    public const string Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";
    public const string CalendarScope = "https://www.googleapis.com/auth/calendar.events";
    public const string Scopes = "openid email " + CalendarScope;

    public static Uri Url(string clientId, string redirectUri, string state)
    {
        var query = new Dictionary<string, string>
        {
            ["client_id"] = clientId,
            ["redirect_uri"] = redirectUri,
            ["response_type"] = "code",
            ["scope"] = Scopes,
            ["access_type"] = "offline",
            // Google issues a refresh token only on consent; always ask so a reconnect gets one.
            ["prompt"] = "consent",
            ["include_granted_scopes"] = "false",
            ["state"] = state,
        };
        return new Uri(Endpoint + "?" + string.Join("&",
            query.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}")));
    }
}
