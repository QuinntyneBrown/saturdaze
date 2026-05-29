using System.Text.Json;
using System.Text.Json.Nodes;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Ingestion;

/// <summary>
/// Turns the model's raw assistant text into a typed list of
/// <see cref="IngestionItem"/>. Tolerant of prose or markdown fences around the
/// JSON array, and validates each row independently so one malformed entry
/// never aborts the rest of the batch — the count of refused rows flows back to
/// the audit record as part of <see cref="IngestionParseResult.Rejected"/>.
/// </summary>
public sealed class IngestionResultParser
{
    private static readonly IngestionParseResult Empty = new(Array.Empty<IngestionItem>(), 0, 0);

    public IngestionParseResult Parse(string rawText, IngestionType type)
    {
        if (string.IsNullOrWhiteSpace(rawText))
            return Empty;

        // The model is told to return only the array, but it sometimes wraps it
        // in prose. Scan each '[' in turn so a bracketed phrase in that prose
        // can't shadow the real array: a non-JSON phrase like "[Port Credit]"
        // throws and we move on, and a valid-but-useless array like "[2026]"
        // (no objects) is kept only as a fallback while we keep looking for an
        // array that actually yields rows.
        IngestionParseResult? fallback = null;
        var searchFrom = 0;

        while (searchFrom < rawText.Length)
        {
            var open = rawText.IndexOf('[', searchFrom);
            if (open < 0)
                break;

            var arrayText = ExtractJsonArray(rawText, open);
            if (arrayText is null)
                break; // no balanced array from here to the end

            JsonArray? array = null;
            try
            {
                array = JsonNode.Parse(arrayText) as JsonArray;
            }
            catch (JsonException)
            {
                // Not JSON (e.g. "[Port Credit]") — try the next bracket.
            }

            if (array is not null)
            {
                var result = BuildItems(array, type);
                if (result.Items.Count > 0)
                    return result;       // found the real data
                fallback ??= result;     // valid array but no usable rows; keep looking
            }

            searchFrom = open + 1;
        }

        return fallback ?? Empty;
    }

    private static IngestionParseResult BuildItems(JsonArray array, IngestionType type)
    {
        var items = new List<IngestionItem>();
        var rejected = 0;
        var considered = 0;

        foreach (var node in array)
        {
            considered++;
            if (node is not JsonObject obj)
            {
                rejected++;
                continue;
            }

            // Detach from the parse buffer so the item owns its payload.
            var owned = (JsonObject)obj.DeepClone();
            var item = TryBuildItem(owned, type);
            if (item is null)
                rejected++;
            else
                items.Add(item);
        }

        return new IngestionParseResult(items, considered, rejected);
    }

    private static IngestionItem? TryBuildItem(JsonObject o, IngestionType type) => type switch
    {
        IngestionType.Events => TryBuildEvent(o),
        IngestionType.Activities => TryBuildActivity(o),
        IngestionType.Restaurants => TryBuildRestaurant(o),
        _ => null
    };

    private static IngestionItem? TryBuildEvent(JsonObject o)
    {
        if (!PayloadReader.TryGetString(o, "name", out var name)) return null;
        if (!PayloadReader.TryGetDate(o, "startsOn", out var startsOn)) return null;
        if (!PayloadReader.TryGetString(o, "location", out var location)) return null;

        // endsOn is optional; default to a single-day event.
        if (!PayloadReader.TryGetDate(o, "endsOn", out var endsOn) || endsOn < startsOn)
        {
            endsOn = startsOn;
            o["endsOn"] = startsOn.ToString("yyyy-MM-dd");
        }

        var key = $"{name}|{startsOn:yyyy-MM-dd}|{location}".ToLowerInvariant();
        return new IngestionItem(key, name, o);
    }

    private static IngestionItem? TryBuildActivity(JsonObject o)
    {
        if (!PayloadReader.TryGetString(o, "name", out var name)) return null;
        var key = name.ToLowerInvariant();
        return new IngestionItem(key, name, o);
    }

    private static IngestionItem? TryBuildRestaurant(JsonObject o)
    {
        if (!PayloadReader.TryGetString(o, "name", out var name)) return null;
        if (!PayloadReader.TryGetString(o, "slot", out var slotText)) return null;
        if (!Enum.TryParse<MealSlot>(slotText, ignoreCase: true, out var slot) || !Enum.IsDefined(slot))
            return null;

        // Normalise the casing so the upserter can trust it.
        o["slot"] = slot.ToString();
        var key = $"{name}|{slot}".ToLowerInvariant();
        return new IngestionItem(key, name, o);
    }

    /// <summary>
    /// Returns the substring spanning the first complete top-level JSON array at
    /// or after <paramref name="startIndex"/>, ignoring brackets that appear
    /// inside strings. Lets prose or ```json fences wrap the array, and lets the
    /// caller resume scanning past a bracket that did not yield usable data.
    /// </summary>
    internal static string? ExtractJsonArray(string text, int startIndex = 0)
    {
        if (string.IsNullOrWhiteSpace(text) || startIndex < 0 || startIndex >= text.Length) return null;

        var start = text.IndexOf('[', startIndex);
        if (start < 0) return null;

        var depth = 0;
        var inString = false;
        var escaped = false;

        for (var i = start; i < text.Length; i++)
        {
            var c = text[i];
            if (inString)
            {
                if (escaped) escaped = false;
                else if (c == '\\') escaped = true;
                else if (c == '"') inString = false;
            }
            else if (c == '"') inString = true;
            else if (c == '[') depth++;
            else if (c == ']')
            {
                depth--;
                if (depth == 0)
                    return text.Substring(start, i - start + 1);
            }
        }

        return null;
    }
}
