using System.Globalization;
using System.Text.Json.Nodes;

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
            return DateOnly.TryParseExact(s.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out value);
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
