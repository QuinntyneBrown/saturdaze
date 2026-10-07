using MediatR;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>Unreviewed provider photos, newest first (L2-120 AC1).</summary>
public sealed record ListPhotoReviewsQuery : IRequest<IReadOnlyList<PhotoReviewItemDto>>;
