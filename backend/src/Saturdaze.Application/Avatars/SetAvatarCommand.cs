using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Avatars;

/// <summary>Sets or replaces the current user's profile photo (L2-087).</summary>
public record SetAvatarCommand(byte[] Data) : IRequest<UserDto>;
