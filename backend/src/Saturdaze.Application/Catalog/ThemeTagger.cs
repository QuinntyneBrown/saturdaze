using Saturdaze.Domain.Entities;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Catalog;

/// <summary>
/// Tags a catalog place with the content themes its words give away (L2-194), so
/// "Park your Pumpkin" and "Symphony Spooktacular" are Halloween events even when
/// no one said so. A deterministic backstop under ingestion's own themes and the
/// agents' judgement; it errs on the side of leaving a themed place out.
/// </summary>
public static class ThemeTagger
{
    private static readonly IReadOnlyDictionary<string, string[]> Keywords = new Dictionary<string, string[]>
    {
        [ContentThemes.Halloween] = new[]
        {
            "halloween", "hallowe'en", "pumpkin", "jack-o", "haunt", "spook", "ghost", "ghoul",
            "trick-or-treat", "trick or treat", "costume", "witch", "zombie", "fright", "monster mash", "boo bash",
        },
        [ContentThemes.Christmas] = new[] { "christmas", "santa", "xmas", "holiday lights", "winter wonderland", "nutcracker" },
        [ContentThemes.Easter] = new[] { "easter", "egg hunt" },
        [ContentThemes.Valentines] = new[] { "valentine" },
        [ContentThemes.Alcohol] = new[] { "brewery", "beer", "wine tasting", "winery", "cocktail", "pub crawl", "drag brunch" },
        [ContentThemes.Horror] = new[] { "horror", "scream", "terror", "nightmare", "slasher", "haunted house" },
    };

    public static IReadOnlyList<string> Tag(params string?[] texts)
    {
        var text = string.Join(' ', texts.Where(t => !string.IsNullOrWhiteSpace(t))).ToLowerInvariant();
        return Keywords
            .Where(k => k.Value.Any(word => text.Contains(word, StringComparison.Ordinal)))
            .Select(k => k.Key)
            .ToList();
    }

    /// <summary>The place's stored themes and the tagged ones, lower-case, without repeats.</summary>
    public static IReadOnlyList<string> Of(LocalEvent e) =>
        Union(e.Themes, Tag(e.Name, e.Category, e.Url));

    public static IReadOnlyList<string> Of(Activity a) =>
        Union(a.Themes, Tag(a.Name, a.Category, a.Description, a.SourceUrl));

    private static IReadOnlyList<string> Union(IEnumerable<string> stored, IEnumerable<string> tagged) =>
        stored.Select(t => t.Trim().ToLowerInvariant()).Concat(tagged).Distinct().OrderBy(t => t, StringComparer.Ordinal).ToList();
}
