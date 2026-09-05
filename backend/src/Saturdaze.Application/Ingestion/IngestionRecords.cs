using System.Text.Json.Nodes;

namespace Saturdaze.Application.Ingestion;

/// <summary>
/// One catalog row as produced by <see cref="IngestionResultParser"/> and
/// consumed by <see cref="CatalogUpserter"/>. <see cref="NaturalKey"/> is the
/// lower-cased dedupe key for the row's type; <see cref="Payload"/> is the
/// validated JSON object the upserter maps onto the matching entity. A
/// <see cref="JsonObject"/> (owned node) is used rather than a
/// <c>JsonElement</c> so the item can outlive the parse buffer safely.
/// </summary>
public sealed record IngestionItem(string NaturalKey, string DisplayName, JsonObject Payload);

/// <summary>Outcome of parsing a model response into items.</summary>
public sealed record IngestionParseResult(
    IReadOnlyList<IngestionItem> Items,
    int Considered,
    int Rejected);

/// <summary>Outcome of upserting a batch of items into a catalog.</summary>
public sealed record UpsertResult(int Inserted, int Updated, int Rejected)
{
    public int Upserted => Inserted + Updated;

    public static readonly UpsertResult Empty = new(0, 0, 0);
}

/// <summary>
/// The per-run, PII-free context passed to <see cref="IngestionPrompts"/>:
/// the family's geographic centre, the drive radius, and the weekend to
/// anchor the search around. No member names, ages, or preferences are ever
/// included.
/// </summary>
public sealed record IngestionContext(string HomeLocation, int MaxDriveMinutes, DateOnly ThisWeekend);
