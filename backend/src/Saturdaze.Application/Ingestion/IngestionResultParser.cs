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
    public IngestionParseResult Parse(string rawText, IngestionType type)
    {
        var arrayText = ExtractJsonArray(rawText);
        if (arrayText is null)
            return new IngestionParseResult(Array.Empty<IngestionItem>(), 0, 0);

        JsonArray? array;
        try
        {
            array = JsonNode.Parse(arrayText) as JsonArray;
        }
        catch (JsonException)
        {
            return new IngestionParseResult(Array.Empty<IngestionItem>(), 0, 0);
        }

        if (array is null)
            return new IngestionParseResult(Array.Empty<IngestionItem>(), 0, 0);

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
    /// Returns the substring spanning the first complete top-level JSON array in
    /// <paramref name="text"/>, ignoring brackets that appear inside strings.
    /// Lets prose or ```json fences wrap the array without breaking parsing.
    /// </summary>
    internal static string? ExtractJsonArray(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;

        var start = text.IndexOf('[');
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
