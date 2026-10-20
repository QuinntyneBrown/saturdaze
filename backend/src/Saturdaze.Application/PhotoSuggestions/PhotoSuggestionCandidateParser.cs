using System.Text.Json;

namespace Saturdaze.Application.PhotoSuggestions;

/// <summary>
/// Reads the JSON array out of Claude's answer (L2-157), tolerating prose and code fences around
/// it, and keeps only entries with an image address and an attribution. Nothing else of the
/// answer is kept, so the model's text never reaches a client.
/// </summary>
public static class PhotoSuggestionCandidateParser
{
    public static IReadOnlyList<PhotoSuggestionCandidate> Parse(string? rawText)
    {
        if (string.IsNullOrWhiteSpace(rawText)) return [];
        var start = rawText.IndexOf('[');
        var end = rawText.LastIndexOf(']');
        if (start < 0 || end <= start) return [];

        JsonDocument doc;
        try
        {
            doc = JsonDocument.Parse(rawText[start..(end + 1)]);
        }
        catch (JsonException)
        {
            return [];
        }

        using (doc)
        {
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return [];
            var result = new List<PhotoSuggestionCandidate>();
            foreach (var entry in doc.RootElement.EnumerateArray())
            {
                if (entry.ValueKind != JsonValueKind.Object) continue;
                var imageUrl = Text(entry, "imageUrl");
                var attribution = Text(entry, "attribution");
                if (string.IsNullOrWhiteSpace(imageUrl) || string.IsNullOrWhiteSpace(attribution)) continue;
                var sourceName = Text(entry, "sourceName");
                result.Add(new PhotoSuggestionCandidate(
                    imageUrl.Trim(),
                    Trim(Text(entry, "title"), 120, string.IsNullOrWhiteSpace(sourceName) ? "Photo" : $"Photo from {sourceName.Trim()}"),
                    Trim(sourceName, 120, "The web"),
                    Trim(Text(entry, "sourceUrl"), 500, string.Empty),
                    Trim(attribution, 300, string.Empty),
                    Trim(Text(entry, "licence") ?? Text(entry, "license"), 120, "See source page")));
            }
            return result;
        }
    }

    private static string? Text(JsonElement entry, string name)
    {
        foreach (var property in entry.EnumerateObject())
        {
            if (string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase)
                && property.Value.ValueKind == JsonValueKind.String)
                return property.Value.GetString();
        }
        return null;
    }

    private static string Trim(string? value, int max, string fallback)
    {
        var v = value?.Trim();
        if (string.IsNullOrEmpty(v)) return fallback;
        return v.Length <= max ? v : v[..max];
    }
}
