using MediatR;

namespace Saturdaze.Application.Auth;

/// <summary>Sign-out: revokes the presented refresh token. Idempotent.</summary>
public sealed record RevokeRefreshTokenCommand(string RefreshToken) : IRequest;
