namespace Saturdaze.Domain.Enums;

/// <summary>
/// Whether an administrator has looked at a place photo (L2-120). Ingestion stores
/// provider photos <see cref="Unreviewed"/>; curated, seeded and decided photos are
/// <see cref="Reviewed"/>. Persisted as integers.
/// </summary>
public enum PhotoReviewState
{
    Unreviewed = 1,
    Reviewed = 2
}
