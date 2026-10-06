using System.Globalization;
using System.Text.Json.Nodes;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Ingestion;

/// <summary>
/// Lenient readers over the loosely-typed JSON the model returns. The parser
/// uses the <c>TryGet*</c> forms to validate shape; the upserter uses the
/// <c>*OrDefault</c> forms to map already-validated rows onto entities.
/// Numbers that arrive as strings (a common model quirk) are tolerated.
/// </summary>
internal static class PayloadReader
{
    public static bool TryGetString(JsonObject o, string key, out string value)
    {
        value = string.Empty;
        if (o.TryGetPropertyValue(key, out var node) && node is JsonValue v && v.TryGetValue<string>(out var s))
        {
            s = s.Trim();
            if (s.Length > 0)
            {
                value = s;
                return true;
            }
        }
        return false;
    }

    public static string GetStringOrEmpty(JsonObject o, string key)
        => TryGetString(o, key, out var s) ? s : string.Empty;

    public static bool TryGetInt(JsonObject o, string key, out int value)
    {
        value = 0;
        if (!o.TryGetPropertyValue(key, out var node) || node is not JsonValue v)
            return false;

        if (v.TryGetValue<int>(out value))
            return true;

        if (v.TryGetValue<double>(out var d))
        {
            value = (int)Math.Round(d);
            return true;
        }

        if (v.TryGetValue<string>(out var s)
            && int.TryParse(s.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out value))
            return true;

        return false;
    }

    public static int GetIntOrDefault(JsonObject o, string key, int fallback = 0)
        => TryGetInt(o, key, out var i) ? i : fallback;

    public static decimal? GetDecimalOrNull(JsonObject o, string key)
    {
        if (!o.TryGetPropertyValue(key, out var node) || node is not JsonValue v)
            return null;
        if (v.TryGetValue<decimal>(out var m)) return m;
        if (v.TryGetValue<double>(out var d)) return (decimal)d;
        if (v.TryGetValue<string>(out var s)
            && decimal.TryParse(s.Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out m))
            return m;
        return null;
    }

    /// <summary>
    /// The place's location from <c>latitude</c>, <c>longitude</c> and <c>address</c> (L2-099),
    /// or null when a coordinate is missing or out of range.
    /// </summary>
    public static GeoLocation? GetGeo(JsonObject o)
    {
        var lat = GetDecimalOrNull(o, "latitude");
        var lng = GetDecimalOrNull(o, "longitude");
        if (lat is not (>= -90m and <= 90m) || lng is not (>= -180m and <= 180m)) return null;
        var address = GetStringOrEmpty(o, "address");
        return GeoLocation.From(lat, lng, address.Length > 300 ? address[..300] : address);
    }

    public static bool TryGetBool(JsonObject o, string key, out bool value)
    {
        value = false;
        if (!o.TryGetPropertyValue(key, out var node) || node is not JsonValue v)
            return false;

        if (v.TryGetValue<bool>(out value))
            return true;

        if (v.TryGetValue<string>(out var s) && bool.TryParse(s.Trim(), out value))
            return true;

        return false;
    }

    public static bool GetBoolOrDefault(JsonObject o, string key, bool fallback = false)
        => TryGetBool(o, key, out var b) ? b : fallback;

    public static bool TryGetDate(JsonObject o, string key, out DateOnly value)
    {
        value = default;
        if (o.TryGetPropertyValue(key, out var node) && node is JsonValue v && v.TryGetValue<string>(out var s))
        {
            var trimmed = s.Trim();
            if (DateOnly.TryParseExact(trimmed, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out value))
                return true;
            if (DateTimeOffset.TryParse(trimmed, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dateTime))
            {
                value = DateOnly.FromDateTime(dateTime.DateTime);
                return true;
            }
        }
        return false;
    }

    public static List<string> GetStringList(JsonObject o, string key)
    {
        var result = new List<string>();
        if (o.TryGetPropertyValue(key, out var node) && node is JsonArray arr)
        {
            foreach (var element in arr)
            {
                if (element is JsonValue v && v.TryGetValue<string>(out var s) && !string.IsNullOrWhiteSpace(s))
                    result.Add(s.Trim());
            }
        }
        return result;
    }
}
