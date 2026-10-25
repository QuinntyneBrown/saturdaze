using System.Globalization;
using System.Text.Json.Nodes;
using Saturdaze.Domain.Enums;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Ingestion;

/// <summary>
/// The richer facts a catalog row may carry (L2-198, L2-199): verified source, times,
/// hours, season, price tier, ages and themes. A row needs an https source; an
/// optional fact that does not validate is dropped from the payload, never the row.
/// </summary>
internal static class CatalogFacts
{
    public static bool IsHttpsUrl(string? value) =>
        Uri.TryCreate(value?.Trim(), UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps;

    /// <summary>The key of the row's source URL for its type.</summary>
    public static string SourceKey(IngestionType type) => type == IngestionType.Activities ? "sourceUrl" : "url";

    public static void Sanitize(JsonObject o, IngestionType type)
    {
        if (type == IngestionType.Events)
        {
            KeepPair<TimeOnly>(o, "startTime", "endTime", TryTime, (a, b) => a < b);
            KeepPair<int>(o, "minAge", "maxAge", TryAge, (a, b) => a <= b);
        }
        else if (type == IngestionType.Activities)
        {
            KeepPair<TimeOnly>(o, "opensAt", "closesAt", TryTime, (a, b) => a < b);
            KeepPair<int>(o, "seasonStartMonth", "seasonEndMonth", TryMonth, (_, _) => true);
        }
        if (type is IngestionType.Events or IngestionType.Activities)
        {
            if (o.ContainsKey("priceTier") && !(PayloadReader.TryGetInt(o, "priceTier", out var tier) && tier is >= 0 and <= 3))
                o.Remove("priceTier");
            if (o.TryGetPropertyValue("themes", out _))
            {
                var known = PayloadReader.GetStringList(o, "themes").Where(ContentThemes.IsKnown).Select(t => t.ToLowerInvariant());
                o["themes"] = new JsonArray(known.Distinct().Select(t => (JsonNode)JsonValue.Create(t)!).ToArray());
            }
        }
    }

    public static TimeOnly? Time(JsonObject o, string key) => TryTime(o, key, out var t) ? t : null;

    public static int? Int(JsonObject o, string key) => PayloadReader.TryGetInt(o, key, out var i) ? i : null;

    private delegate bool Reader<T>(JsonObject o, string key, out T value);

    /// <summary>Keeps both keys only when both read and agree; otherwise removes both.</summary>
    private static void KeepPair<T>(JsonObject o, string first, string second, Reader<T> read, Func<T, T, bool> agree)
    {
        if (!o.ContainsKey(first) && !o.ContainsKey(second)) return;
        if (read(o, first, out var a) && read(o, second, out var b) && agree(a, b)) return;
        o.Remove(first);
        o.Remove(second);
    }

    private static bool TryTime(JsonObject o, string key, out TimeOnly value)
    {
        value = default;
        return PayloadReader.TryGetString(o, key, out var s)
               && TimeOnly.TryParseExact(s.Trim(), new[] { "HH:mm", "H:mm", "HH:mm:ss" }, CultureInfo.InvariantCulture, DateTimeStyles.None, out value);
    }

    private static bool TryAge(JsonObject o, string key, out int value) =>
        PayloadReader.TryGetInt(o, key, out value) && value is >= 0 and <= 120;

    private static bool TryMonth(JsonObject o, string key, out int value) =>
        PayloadReader.TryGetInt(o, key, out value) && value is >= 1 and <= 12;
}
