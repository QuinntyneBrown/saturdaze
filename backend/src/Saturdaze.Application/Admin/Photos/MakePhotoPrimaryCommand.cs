using MediatR;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>Makes one photo the only primary of its place (L2-117).</summary>
public sealed record MakePhotoPrimaryCommand(Guid PhotoId) : IRequest<AdminPhotoDto>;
