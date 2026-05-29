using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Ingestion;

/// <summary>
/// Parses the <c>--type</c> CLI option / <c>Schedule:Types</c> config value
/// into the set of catalogs to ingest. Shared by the CLI command and the
/// Worker so both accept the same vocabulary.
/// </summary>
public static class IngestionTypes
{
    public static readonly IReadOnlyList<IngestionType> All =
        new[] { IngestionType.Events, IngestionType.Activities, IngestionType.Restaurants };

    /// <summary>
    /// Accepts <c>all</c> or a comma/space separated list of
    /// <c>events|activities|restaurants</c> (case-insensitive). Returns the
    /// distinct types in canonical order. Throws <see cref="ArgumentException"/>
    /// on an unrecognised token.
    /// </summary>
    public static IReadOnlyList<IngestionType> Parse(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return All;

        var tokens = value.Split(new[] { ',', ' ', ';' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (tokens.Length == 0)
            return All;

        var set = new HashSet<IngestionType>();
        foreach (var token in tokens)
        {
            if (token.Equals("all", StringComparison.OrdinalIgnoreCase))
                return All;

            set.Add(token.ToLowerInvariant() switch
            {
                "events" or "event" => IngestionType.Events,
                "activities" or "activity" => IngestionType.Activities,
                "restaurants" or "restaurant" => IngestionType.Restaurants,
                _ => throw new ArgumentException(
                    $"Unknown ingestion type '{token}'. Expected: events, activities, restaurants, or all.")
            });
        }

        return All.Where(set.Contains).ToList();
    }
}
