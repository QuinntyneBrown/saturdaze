using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

/// <summary>
/// The health flags of one place's photos (L2-112, L2-113), in severity order so the
/// health figures, the list filters and the default sort agree.
/// </summary>
public static class PhotoHealth
{
    public const string NoPhoto = "no-photo";
    public const string BlockedUrl = "blocked-url";
    public const string Unreviewed = "unreviewed";
    public const string MissingAlt = "missing-alt";

    /// <summary>Every flag the admin API accepts, worst first.</summary>
    public static readonly IReadOnlyList<string> All = new[] { NoPhoto, BlockedUrl, Unreviewed, MissingAlt };

    /// <summary>
    /// The place's flags, worst first. <paramref name="isAllowed"/> is the HTTPS allow-list
    /// check the family app projects photos through.
    /// </summary>
    public static IReadOnlyList<string> Flags(IEnumerable<PlacePhoto> photos, Func<string, bool> isAllowed)
    {
        var primary = photos.FirstOrDefault(p => p.IsPrimary);
        if (primary is null) return new[] { NoPhoto };

        var flags = new List<string>(2);
        if (!isAllowed(primary.Url)) flags.Add(BlockedUrl);
        if (primary.Source == PhotoSource.Provider && primary.ReviewState == PhotoReviewState.Unreviewed) flags.Add(Unreviewed);
        if (string.IsNullOrWhiteSpace(primary.AltText)) flags.Add(MissingAlt);
        return flags;
    }

    /// <summary>0 for the worst flag, rising with health; healthy places sort last.</summary>
    public static int Severity(IReadOnlyList<string> flags)
    {
        if (flags.Count == 0) return All.Count;
        return flags.Min(f => All.IndexOf(f));
    }

    private static int IndexOf(this IReadOnlyList<string> list, string value)
    {
        for (var i = 0; i < list.Count; i++)
            if (list[i] == value) return i;
        return list.Count;
    }
}
