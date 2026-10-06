using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Avatars;

/// <summary>Removes the current user's profile photo; idempotent (L2-087).</summary>
public record RemoveAvatarCommand() : IRequest<UserDto>;
