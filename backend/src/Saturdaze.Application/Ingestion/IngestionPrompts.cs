using System.Globalization;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Ingestion;

/// <summary>
/// The per-type system and user prompts that steer the grounded web search.
/// Kept apart from the runner because prompts are content, not logic: editing
/// the wording or the schema should be a one-file change reviewable in
/// isolation. Every prompt demands a strict JSON array matching the same shape
/// <see cref="IngestionResultParser"/> validates and <see cref="CatalogUpserter"/>
/// persists, so the three stay in lock-step.
/// </summary>
public static class IngestionPrompts
{
    public static string BuildSystemPrompt(IngestionType type, IngestionContext ctx)
    {
        var weekend = ctx.ThisWeekend.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var nextWeekend = ctx.ThisWeekend.AddDays(7).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

        var preamble =
            $"You are a meticulous local-events researcher curating a weekend catalog for a family " +
            $"living in {ctx.HomeLocation}. You only return places and events within about " +
            $"{ctx.MaxDriveMinutes} minutes' drive of that home. You strongly prefer family- and " +
            $"kid-friendly options. Use the web_search tool to find REAL, currently-listed results " +
            $"from venue, tourism-board, municipal, and farm websites. Verify each row against a real " +
            $"page before including it; if you cannot verify it, leave it out. Never invent a venue, " +
            $"date, or URL.";

        var output =
            "Return ONLY a single JSON array as your final message — no prose, no markdown fences, " +
            "no commentary before or after. Each element MUST match this exact schema (omit any row " +
            "you cannot fully populate and verify):";

        return type switch
        {
            IngestionType.Events =>
                $"{preamble}\n\nFind time-bounded events (festivals, markets, theatre, seasonal openings, " +
                $"community days) happening on or near the weekend of {weekend} and the following weekend " +
                $"of {nextWeekend}. Avoid adults-only events and ticketed concerts over $50 per adult.\n\n" +
                $"{output}\n" +
                "[{\"name\": string, \"startsOn\": \"YYYY-MM-DD\", \"endsOn\": \"YYYY-MM-DD\", " +
                "\"location\": string, \"driveMinutes\": integer, \"url\": string, \"category\": string}]",

            IngestionType.Activities =>
                $"{preamble}\n\nFind mostly-evergreen places to spend an afternoon (parks, trails, " +
                $"conservation areas, farms, museums, indoor play centres). These are not date-bound; pick " +
                $"things worth doing across the season. Set \"indoor\" true for venues that work in bad " +
                $"weather. \"weatherTags\" is a subset of [\"sunny\",\"warm\",\"mild\",\"cool\",\"rain\",\"cold\"] " +
                $"describing when the activity is best.\n\n" +
                $"{output}\n" +
                "[{\"name\": string, \"category\": string, \"indoor\": boolean, \"minAge\": integer, " +
                "\"maxAge\": integer, \"driveMinutes\": integer, \"weatherTags\": [string], " +
                "\"typicalDurationMinutes\": integer, \"description\": string, \"mapUrl\": string}]",

            IngestionType.Restaurants =>
                $"{preamble}\n\nFind family-friendly restaurants. \"slot\" is \"Lunch\" or \"Dinner\". " +
                $"\"wifeApproved\" is true for relaxed, quality, not-too-loud places a discerning adult " +
                $"would happily return to (as opposed to purely kid-driven chains). \"notes\" is a short " +
                $"reason it earns its place.\n\n" +
                $"{output}\n" +
                "[{\"name\": string, \"style\": string, \"slot\": \"Lunch\"|\"Dinner\", " +
                "\"wifeApproved\": boolean, \"driveMinutes\": integer, \"notes\": string}]",

            _ => throw new ArgumentOutOfRangeException(nameof(type), type, "Unsupported ingestion type.")
        };
    }

    public static string BuildUserPrompt(IngestionType type, IngestionContext ctx)
    {
        var weekend = ctx.ThisWeekend.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        return type switch
        {
            IngestionType.Events =>
                $"List family-friendly events near {ctx.HomeLocation} for the weekend of {weekend} and the " +
                $"weekend after. Return the JSON array only.",
            IngestionType.Activities =>
                $"List family-friendly activities and day-trip spots within {ctx.MaxDriveMinutes} minutes of " +
                $"{ctx.HomeLocation}. Return the JSON array only.",
            IngestionType.Restaurants =>
                $"List family-friendly lunch and dinner restaurants within {ctx.MaxDriveMinutes} minutes of " +
                $"{ctx.HomeLocation}. Return the JSON array only.",
            _ => throw new ArgumentOutOfRangeException(nameof(type), type, "Unsupported ingestion type.")
        };
    }
}
