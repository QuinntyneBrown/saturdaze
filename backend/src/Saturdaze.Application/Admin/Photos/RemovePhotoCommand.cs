using MediatR;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>
/// Deletes a photo and, for a curated upload, its stored file (L2-119). Removing the primary
/// needs <paramref name="NextPrimaryId"/>: a sibling's id, or <c>none</c> to leave the place
/// without a photo.
/// </summary>
public sealed record RemovePhotoCommand(Guid PhotoId, string? NextPrimaryId) : IRequest;
