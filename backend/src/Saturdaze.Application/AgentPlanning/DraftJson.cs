using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.AgentPlanning;

public enum PickKind
{
    Activity,
    Event
}

/// <summary>One outing the drafter proposes (L2-202): a day, a catalog place, an optional start and a reason.</summary>
public sealed record DraftPick(DayOfWeekend Day, PickKind Kind, Guid Id, TimeOnly? Start, string Reason);

/// <summary>One place the curator shortlists, with why and what it was checked against.</summary>
public sealed record ShortlistItem(PickKind Kind, Guid Id, string Reason, IReadOnlyList<string> Checked);

/// <summary>
/// The roles' JSON answers (L2-202) and the stored draft's columns (L2-204). Tolerant of prose or
/// fences around the object; strict about each field, so a malformed answer is an output violation.
/// </summary>
public static class DraftJson
{
    public const int MaxReasonLength = 200;
    public const int MaxShortlist = 12;

    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() },
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public static bool TryParseShortlist(string text, out List<ShortlistItem> items, out List<string> errors)
    {
        items = new();
        errors = new();
        if (!TryRoot(text, "shortlist", out var array)) { errors.Add("no shortlist array"); return false; }
        foreach (var e in array.EnumerateArray().Take(MaxShortlist))
        {
            if (!TryKind(e, out var kind) || !TryId(e, out var id)) { errors.Add("a shortlist item without a kind and id"); continue; }
            var reason = Str(e, "reason");
            var checks = e.TryGetProperty("checked", out var c) && c.ValueKind == JsonValueKind.Array
                ? c.EnumerateArray().Where(x => x.ValueKind == JsonValueKind.String).Select(x => x.GetString()!).ToList()
                : new List<string>();
            items.Add(new ShortlistItem(kind, id, Clip(reason), checks));
        }
        return true;
    }

    public static bool TryParsePicks(string text, out List<DraftPick> picks, out List<string> errors)
    {
        picks = new();
        errors = new();
        if (!TryRoot(text, "picks", out var array)) { errors.Add("no picks array"); return false; }
        foreach (var e in array.EnumerateArray())
        {
            if (!Enum.TryParse<DayOfWeekend>(Str(e, "day"), true, out var day) || !Enum.IsDefined(day))
            {
                errors.Add("a pick without a Saturday or Sunday day");
                continue;
            }
            if (!TryKind(e, out var kind) || !TryId(e, out var id)) { errors.Add("a pick without a kind and id"); continue; }
            TimeOnly? start = TimeOnly.TryParseExact(Str(e, "start"), new[] { "HH:mm", "H:mm" }, CultureInfo.InvariantCulture,
                DateTimeStyles.None, out var s) ? s : null;
            picks.Add(new DraftPick(day, kind, id, start, Clip(Str(e, "reason"))));
        }
        return true;
    }

    public static string Serialize<T>(T value) => JsonSerializer.Serialize(value, Options);

    public static List<DraftPick> DeserializePicks(string json) =>
        JsonSerializer.Deserialize<List<DraftPick>>(json, Options) ?? new();

    public static List<ShortlistItem> DeserializeShortlist(string json) =>
        JsonSerializer.Deserialize<List<ShortlistItem>>(json, Options) ?? new();

    private static string Clip(string reason)
    {
        var r = reason.Trim();
        return r.Length <= MaxReasonLength ? r : r[..MaxReasonLength];
    }

    private static bool TryRoot(string text, string property, out JsonElement array)
    {
        array = default;
        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');
        if (start < 0 || end <= start) return false;
        try
        {
            using var doc = JsonDocument.Parse(text[start..(end + 1)]);
            if (!doc.RootElement.TryGetProperty(property, out var a) || a.ValueKind != JsonValueKind.Array) return false;
            array = a.Clone();
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static bool TryKind(JsonElement e, out PickKind kind) =>
        Enum.TryParse(Str(e, "kind"), true, out kind) && Enum.IsDefined(kind);

    private static bool TryId(JsonElement e, out Guid id) => Guid.TryParse(Str(e, "id"), out id);

    private static string Str(JsonElement e, string name) =>
        e.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() ?? string.Empty : string.Empty;
}
