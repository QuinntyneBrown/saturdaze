using MediatR;

namespace Saturdaze.Application.Avatars;

/// <summary>Resolves an avatar capability token to the stored photo (L2-087).</summary>
public record GetAvatarQuery(Guid Token) : IRequest<AvatarImageDto>;

public record AvatarImageDto(byte[] Data, string ContentType);
