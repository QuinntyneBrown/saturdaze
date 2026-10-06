using Saturdaze.Application.Abstractions;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>
/// Persists a primary change in two steps. The database enforces one primary per place with a
/// filtered unique index, which a single batch that sets the new primary before clearing the old
/// one can trip; clearing first, then promoting, keeps every statement valid (L2-100 AC1).
/// </summary>
public static class PrimaryPhotoWriter
{
    public static async Task MarkPrimaryAsync(IAppDbContext db, IReadOnlyList<PlacePhoto> siblings, Guid? photoId, CancellationToken ct)
    {
        var cleared = false;
        foreach (var sibling in siblings.Where(s => s.IsPrimary && s.Id != photoId))
        {
            sibling.IsPrimary = false;
            cleared = true;
        }
        if (cleared) await db.SaveChangesAsync(ct);

        if (photoId is { } id)
        {
            PlacePhotoSet.MarkPrimary(siblings, id);
            await db.SaveChangesAsync(ct);
        }
    }
}
