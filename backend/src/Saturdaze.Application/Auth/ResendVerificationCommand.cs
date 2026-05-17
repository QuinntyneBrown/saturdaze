using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Auth;

public record ResendVerificationCommand(string Email) : IRequest<AuthTokenDeliveryDto>;
