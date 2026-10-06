using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Cli.Seed;

/// <summary>One place photo in seed JSON (L2-100). Re-seeding updates by URL, never duplicates.</summary>
internal sealed record PhotoRecord(
    string Url,
    int Width,
    int Height,
    string? Alt,
    string? Attribution,
    string? License,
    PhotoSource Source = PhotoSource.Curated,
    bool Primary = false);

internal static class SeedPhotos
{
    /// <summary>
    /// Upserts the place's photos by URL. Records without attribution or licence are dropped.
    /// The record marked primary (else the first) is the place's only primary photo.
    /// </summary>
    public static void Apply(AppDbContext db, PlaceKind kind, Guid placeId, IReadOnlyList<PhotoRecord>? records)
    {
        if (records is null || records.Count == 0) return;

        var photos = db.PlacePhotos.Local.Where(p => p.PlaceKind == kind && p.PlaceId == placeId).ToList();
        photos.AddRange(db.PlacePhotos.Where(p => p.PlaceKind == kind && p.PlaceId == placeId).ToList()
            .Where(p => !photos.Contains(p)));

        PlacePhoto? primary = null;
        var anyMarked = records.Any(r => r.Primary);
        foreach (var record in records)
        {
            var photo = photos.FirstOrDefault(p => p.Url == record.Url);
            var fresh = PlacePhoto.Create(kind, placeId, record.Url, record.Width, record.Height,
                record.Alt, record.Attribution, record.Source, record.License, primary: false);
            if (fresh is null) continue;

            if (photo is null)
            {
                photo = fresh;
                photos.Add(photo);
                db.PlacePhotos.Add(photo);
            }
            else
            {
                photo.Width = fresh.Width;
                photo.Height = fresh.Height;
                photo.AltText = fresh.AltText;
                photo.Attribution = fresh.Attribution;
                photo.Source = fresh.Source;
                photo.License = fresh.License;
            }

            var wanted = anyMarked ? record.Primary : true;
            if (wanted && primary is null) primary = photo;
        }

        if (primary is not null) PlacePhotoSet.MarkPrimary(photos, primary.Id);
    }
}
