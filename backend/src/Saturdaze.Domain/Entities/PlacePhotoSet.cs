namespace Saturdaze.Domain.Entities;

/// <summary>Rules over the photos of one place (L2-088).</summary>
public static class PlacePhotoSet
{
    /// <summary>Makes <paramref name="photoId"/> the only primary photo among <paramref name="photos"/>.</summary>
    public static void MarkPrimary(IEnumerable<PlacePhoto> photos, Guid photoId)
    {
        foreach (var photo in photos)
            photo.IsPrimary = photo.Id == photoId;
    }
}
