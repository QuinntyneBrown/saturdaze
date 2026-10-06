using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Ingestion;

/// <summary>
/// Idempotently writes parsed items into the <c>LocalEvents</c>,
/// <c>Activities</c>, or <c>Restaurants</c> catalog, deduping on each type's
/// natural key so re-running an ingestion updates rows in place rather than
/// duplicating them. Descriptive fields that exceed their column length are
/// truncated; a row is rejected only when its key field is unusable, so one bad
/// row never sinks the batch.
/// </summary>
public sealed class CatalogUpserter
{
    private readonly IAppDbContext _db;
    private readonly List<string> _skips = new();

    public CatalogUpserter(IAppDbContext db) => _db = db;

    public async Task<UpsertResult> UpsertAsync(
        IReadOnlyList<IngestionItem> items, IngestionType type, CancellationToken cancellationToken)
    {
        if (items.Count == 0) return UpsertResult.Empty;

        _skips.Clear();
        var result = type switch
        {
            IngestionType.Events => await UpsertEventsAsync(items, cancellationToken),
            IngestionType.Activities => await UpsertActivitiesAsync(items, cancellationToken),
            IngestionType.Restaurants => await UpsertRestaurantsAsync(items, cancellationToken),
            _ => UpsertResult.Empty
        };

        await _db.SaveChangesAsync(cancellationToken);
        return result with { SkipReasons = _skips.ToList() };
    }

    /// <summary>
    /// Adds the row's <c>photos</c> candidates as provider photos (L2-100). A candidate without
    /// attribution or licence is never stored, nor is one an administrator rejected (L2-121 AC1);
    /// each skip is reported for the run audit. A URL the place already has is left alone, and
    /// the first stored photo becomes primary when the place has none (L2-121 AC2).
    /// </summary>
    private async Task AddPhotosAsync(PlaceKind kind, Guid placeId, string placeName, JsonObject p, CancellationToken ct)
    {
        if (!p.TryGetPropertyValue("photos", out var node) || node is not JsonArray candidates)
            return;

        var known = _db.PlacePhotos.Local.Where(x => x.PlaceKind == kind && x.PlaceId == placeId).ToList();
        var stored = await _db.PlacePhotos.Where(x => x.PlaceKind == kind && x.PlaceId == placeId).ToListAsync(ct);
        known.AddRange(stored.Where(s => !known.Contains(s)));
        var hasPrimary = known.Any(x => x.IsPrimary);
        var rejected = await _db.RejectedPlacePhotos
            .Where(r => r.PlaceKind == kind && r.PlaceId == placeId)
            .Select(r => r.Url)
            .ToListAsync(ct);

        foreach (var candidate in candidates.OfType<JsonObject>())
        {
            var url = PayloadReader.GetStringOrEmpty(candidate, "url");
            if (url.Length == 0 || url.Length > 1000 || known.Any(x => x.Url == url)) continue;
            if (rejected.Contains(url, StringComparer.Ordinal))
            {
                // An administrator rejected this address for the place; never store it again (L2-121 AC1).
                _skips.Add($"{placeName}: photo {url} skipped, previously rejected");
                continue;
            }

            var photo = PlacePhoto.Create(
                kind,
                placeId,
                url,
                PayloadReader.GetIntOrDefault(candidate, "width"),
                PayloadReader.GetIntOrDefault(candidate, "height"),
                Truncate(PayloadReader.GetStringOrEmpty(candidate, "alt"), 300),
                Truncate(PayloadReader.GetStringOrEmpty(candidate, "attribution"), 300),
                PhotoSource.Provider,
                Truncate(PayloadReader.GetStringOrEmpty(candidate, "license"), 120),
                primary: !hasPrimary,
                reviewState: PhotoReviewState.Unreviewed);
            if (photo is null)
            {
                _skips.Add($"{placeName}: photo {url} skipped, missing attribution or licence");
                continue;
            }

            hasPrimary = true;
            known.Add(photo);
            _db.PlacePhotos.Add(photo);
        }
    }

    private async Task<UpsertResult> UpsertEventsAsync(IReadOnlyList<IngestionItem> items, CancellationToken ct)
    {
        var names = IncomingNames(items, maxLength: 200);
        var existing = (await _db.LocalEvents
                .Where(e => names.Contains(e.Name))
                .ToListAsync(ct))
            .ToDictionary(EventKey, StringComparer.Ordinal);

        int inserted = 0, updated = 0, rejected = 0;
        foreach (var item in items)
        {
            var p = item.Payload;
            var name = PayloadReader.GetStringOrEmpty(p, "name");
            var location = PayloadReader.GetStringOrEmpty(p, "location");
            if (name.Length > 200 || location.Length > 200)
            {
                rejected++;
                continue;
            }

            if (!existing.TryGetValue(item.NaturalKey, out var entity))
            {
                entity = new LocalEvent { Id = Guid.NewGuid() };
                _db.LocalEvents.Add(entity);
                existing[item.NaturalKey] = entity;
                inserted++;
            }
            else
            {
                updated++;
            }

            entity.Name = name;
            entity.Location = location;
            PayloadReader.TryGetDate(p, "startsOn", out var startsOn);
            entity.StartsOn = startsOn;
            entity.EndsOn = PayloadReader.TryGetDate(p, "endsOn", out var endsOn) && endsOn >= startsOn ? endsOn : startsOn;
            entity.DriveMinutes = PayloadReader.GetIntOrDefault(p, "driveMinutes");
            entity.Url = Truncate(PayloadReader.GetStringOrEmpty(p, "url"), 500);
            entity.Category = Truncate(PayloadReader.GetStringOrEmpty(p, "category"), 80);
            entity.Geo = GeoLocation.Merge(entity.Geo, PayloadReader.GetGeo(p));
            await AddPhotosAsync(PlaceKind.LocalEvent, entity.Id, name, p, ct);
        }

        return new UpsertResult(inserted, updated, rejected);
    }

    private async Task<UpsertResult> UpsertActivitiesAsync(IReadOnlyList<IngestionItem> items, CancellationToken ct)
    {
        var names = IncomingNames(items, maxLength: 160);
        var existing = (await _db.Activities
                .Where(a => names.Contains(a.Name))
                .ToListAsync(ct))
            .GroupBy(a => a.Name.ToLowerInvariant(), StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.Ordinal);

        int inserted = 0, updated = 0, rejected = 0;
        foreach (var item in items)
        {
            var p = item.Payload;
            var name = PayloadReader.GetStringOrEmpty(p, "name");
            if (name.Length is 0 or > 160)
            {
                rejected++;
                continue;
            }

            if (!existing.TryGetValue(item.NaturalKey, out var entity))
            {
                entity = new Activity { Id = Guid.NewGuid() };
                _db.Activities.Add(entity);
                existing[item.NaturalKey] = entity;
                inserted++;
            }
            else
            {
                updated++;
            }

            entity.Name = name;
            entity.Category = Truncate(PayloadReader.GetStringOrEmpty(p, "category"), 80);
            entity.Indoor = PayloadReader.GetBoolOrDefault(p, "indoor");
            entity.MinAge = PayloadReader.GetIntOrDefault(p, "minAge");
            entity.MaxAge = PayloadReader.GetIntOrDefault(p, "maxAge", 99);
            entity.DriveMinutes = PayloadReader.GetIntOrDefault(p, "driveMinutes");
            entity.WeatherTags = PayloadReader.GetStringList(p, "weatherTags");
            entity.TypicalDurationMinutes = PayloadReader.GetIntOrDefault(p, "typicalDurationMinutes");
            entity.Description = Truncate(PayloadReader.GetStringOrEmpty(p, "description"), 2000);
            entity.MapUrl = Truncate(PayloadReader.GetStringOrEmpty(p, "mapUrl"), 500);
            entity.Geo = GeoLocation.Merge(entity.Geo, PayloadReader.GetGeo(p));
            await AddPhotosAsync(PlaceKind.Activity, entity.Id, name, p, ct);
        }

        return new UpsertResult(inserted, updated, rejected);
    }

    private async Task<UpsertResult> UpsertRestaurantsAsync(IReadOnlyList<IngestionItem> items, CancellationToken ct)
    {
        var names = IncomingNames(items, maxLength: 160);
        var existing = (await _db.Restaurants
                .Where(r => names.Contains(r.Name))
                .ToListAsync(ct))
            .ToDictionary(r => $"{r.Name}|{r.Slot}".ToLowerInvariant(), StringComparer.Ordinal);

        int inserted = 0, updated = 0, rejected = 0;
        foreach (var item in items)
        {
            var p = item.Payload;
            var name = PayloadReader.GetStringOrEmpty(p, "name");
            if (name.Length is 0 or > 160
                || !Enum.TryParse<MealSlot>(PayloadReader.GetStringOrEmpty(p, "slot"), ignoreCase: true, out var slot))
            {
                rejected++;
                continue;
            }

            if (!existing.TryGetValue(item.NaturalKey, out var entity))
            {
                entity = new Restaurant { Id = Guid.NewGuid() };
                _db.Restaurants.Add(entity);
                existing[item.NaturalKey] = entity;
                inserted++;
            }
            else
            {
                updated++;
            }

            entity.Name = name;
            entity.Slot = slot;
            entity.Style = Truncate(PayloadReader.GetStringOrEmpty(p, "style"), 80);
            entity.WifeApproved = PayloadReader.GetBoolOrDefault(p, "wifeApproved");
            entity.DriveMinutes = PayloadReader.GetIntOrDefault(p, "driveMinutes");
            entity.Notes = Truncate(PayloadReader.GetStringOrEmpty(p, "notes"), 500);
            entity.Geo = GeoLocation.Merge(entity.Geo, PayloadReader.GetGeo(p));
            await AddPhotosAsync(PlaceKind.Restaurant, entity.Id, name, p, ct);
        }

        return new UpsertResult(inserted, updated, rejected);
    }

    /// <summary>
    /// The distinct, in-range names from the incoming batch. Scopes the
    /// "load existing rows for dedupe" query to just the candidates (a SQL
    /// <c>WHERE Name IN (...)</c>) instead of the whole table, keeping the
    /// upsert O(batch) rather than O(catalog) as the catalog grows. Names
    /// outside the column length are dropped here — they are rejected per-row
    /// during the upsert anyway, so there is nothing to dedupe them against.
    /// </summary>
    private static List<string> IncomingNames(IReadOnlyList<IngestionItem> items, int maxLength)
        => items
            .Select(i => PayloadReader.GetStringOrEmpty(i.Payload, "name"))
            .Where(n => n.Length > 0 && n.Length <= maxLength)
            .Distinct(StringComparer.Ordinal)
            .ToList();

    private static string EventKey(LocalEvent e)
        => $"{e.Name}|{e.StartsOn:yyyy-MM-dd}|{e.Location}".ToLowerInvariant();

    private static string Truncate(string value, int max)
        => value.Length <= max ? value : value[..max];
}
