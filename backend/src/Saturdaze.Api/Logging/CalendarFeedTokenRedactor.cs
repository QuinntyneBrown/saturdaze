using System.Text.RegularExpressions;
using Serilog.Core;
using Serilog.Events;

namespace Saturdaze.Api.Logging;

/// <summary>
/// Keeps subscription link tokens out of the logs (L2-177, L2-180): calendar
/// applications fetch <c>/api/calendar/feed/{token}.ics</c> on a schedule, and
/// ASP.NET Core logs the request path with every event of the request.
/// </summary>
public sealed partial class CalendarFeedTokenRedactor : ILogEventEnricher
{
    private static readonly string[] PathProperties = { "RequestPath", "Path", "RequestUri", "Uri" };

    public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
    {
        foreach (var name in PathProperties)
        {
            if (logEvent.Properties.TryGetValue(name, out var value)
                && value is ScalarValue { Value: string path }
                && FeedPath().IsMatch(path))
            {
                logEvent.AddOrUpdateProperty(new LogEventProperty(name, new ScalarValue(Redact(path))));
            }
        }
    }

    public static string Redact(string path) => FeedPath().Replace(path, "/api/calendar/feed/{token}.ics");

    [GeneratedRegex(@"/api/calendar/feed/[^/?#]+\.ics", RegexOptions.IgnoreCase)]
    private static partial Regex FeedPath();
}
