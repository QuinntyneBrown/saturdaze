using MediatR;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>Photo coverage per catalog: activities, restaurants and upcoming events (L2-112).</summary>
public sealed record GetPhotoHealthQuery : IRequest<PhotoHealthDto>;
