using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Auth;

/// <summary>Exchanges a live refresh token for a new access + refresh pair (rotation).</summary>
public sealed record RefreshTokenCommand(string RefreshToken) : IRequest<AuthSuccessDto>;
