using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>
/// One unreviewed provider photo in the review queue (L2-120): the photo, its place and
/// the primary it would replace (null when the place has no primary families can see).
/// </summary>
public sealed record PhotoReviewItemDto(
    AdminPhotoDto Photo,
    string Kind,
    Guid PlaceId,
    string PlaceName,
    PlacePhotoDto? Replaces);
