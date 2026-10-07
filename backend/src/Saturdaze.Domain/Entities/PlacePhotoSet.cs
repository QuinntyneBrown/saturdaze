using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

/// <summary>Rules over the photos of one place (L2-100).</summary>
public static class PlacePhotoSet
{
    /// <summary>Makes <paramref name="photoId"/> the only primary photo among <paramref name="photos"/>.</summary>
    public static void MarkPrimary(IEnumerable<PlacePhoto> photos, Guid photoId)
    {
        foreach (var photo in photos)
            photo.IsPrimary = photo.Id == photoId;
    }

    /// <summary>
    /// The photo families should see when the primary goes without a choice (L2-119, L2-120):
    /// the first curated photo, else the first reviewed provider photo, else none.
    /// </summary>
    public static PlacePhoto? DefaultPrimary(IEnumerable<PlacePhoto> photos)
    {
        var list = photos.ToList();
        return list.FirstOrDefault(p => p.Source == PhotoSource.Curated)
            ?? list.FirstOrDefault(p => p.Source == PhotoSource.Provider && p.ReviewState == PhotoReviewState.Reviewed);
    }

    /// <summary>
    /// Whether a curated photo joining <paramref name="photos"/> becomes primary (L2-115 AC5, AC6;
    /// L2-121 AC5): when the place has no primary, or its primary is a provider photo nobody reviewed.
    /// A primary an administrator chose or a curated one stays.
    /// </summary>
    public static bool ShouldPromoteCurated(IEnumerable<PlacePhoto> photos)
    {
        var primary = photos.FirstOrDefault(p => p.IsPrimary);
        if (primary is null) return true;
        return primary.Source == PhotoSource.Provider
            && primary.ReviewState == PhotoReviewState.Unreviewed
            && !primary.AdminLocked;
    }
}
