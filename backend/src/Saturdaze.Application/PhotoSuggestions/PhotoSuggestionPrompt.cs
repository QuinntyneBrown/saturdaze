using System.Text;

namespace Saturdaze.Application.PhotoSuggestions;

/// <summary>The research request sent to Claude (L2-157): what to look for and the exact JSON to answer with.</summary>
public static class PhotoSuggestionPrompt
{
    public static string System(int maxCandidates) => $"""
        You find photographs on the web for Saturdaze, a family weekend planner. The person wants a photo
        that fits the context they describe. Use web search to locate real photographs of the place, event or
        subject, preferring openly licensed sources (Wikimedia Commons, Flickr Creative Commons, Unsplash,
        Pexels) and the official site of the place. Each image must be a direct link to a JPEG, PNG or WebP
        file over HTTPS, not a page. Never invent an address.

        Answer with a JSON array only, no prose, of at most {maxCandidates} objects with exactly these keys:
        "imageUrl" (direct HTTPS link to the image file), "title" (what the photo shows, under 80 characters),
        "sourceName" (the site or collection), "sourceUrl" (the page the image comes from), "attribution"
        (how to credit it, e.g. "Photo · Jane Doe, Wikimedia Commons"), "licence" (e.g. "CC BY-SA 4.0",
        "Unsplash licence", "Official site"). Leave out any photo whose attribution or licence you cannot
        state. Answer with [] when nothing suitable is found.
        """;

    public static string WeekendCover(string? title, IReadOnlyList<(string Name, string? Address)> stops, string? query, string home)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Find photographs for the cover of a family weekend plan near ").Append(home).AppendLine(".");
        if (!string.IsNullOrWhiteSpace(title)) sb.Append("The weekend is called \"").Append(title.Trim()).AppendLine("\".");
        sb.AppendLine("The stops are:");
        foreach (var (name, address) in stops)
        {
            sb.Append("- ").Append(name);
            if (!string.IsNullOrWhiteSpace(address)) sb.Append(" (").Append(address.Trim()).Append(')');
            sb.AppendLine();
        }
        sb.AppendLine("Prefer landscape photographs of the stops themselves, the main stop first.");
        AppendQuery(sb, query);
        return sb.ToString();
    }

    public static string Place(string kind, string name, string? address, string? query, string home)
    {
        var sb = new StringBuilder();
        sb.Append("Find photographs of the ").Append(kind.ToLowerInvariant()).Append(" \"").Append(name).Append('"');
        if (!string.IsNullOrWhiteSpace(address)) sb.Append(" at ").Append(address.Trim());
        sb.Append(", near ").Append(home).AppendLine(".");
        sb.AppendLine("Prefer landscape photographs that show the place itself, suitable for a family audience.");
        AppendQuery(sb, query);
        return sb.ToString();
    }

    public static string Profile(string query)
    {
        var sb = new StringBuilder();
        sb.Append("Find photographs matching this description for a personal profile picture: \"")
            .Append(query.Trim()).AppendLine("\".");
        sb.AppendLine("Prefer openly licensed photographs that crop well to a square. Never return photographs of identifiable private people.");
        return sb.ToString();
    }

    private static void AppendQuery(StringBuilder sb, string? query)
    {
        if (!string.IsNullOrWhiteSpace(query))
            sb.Append("The person adds: \"").Append(query.Trim()).AppendLine("\".");
    }
}
