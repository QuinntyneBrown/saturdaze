using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Auth;

public record ForgotPasswordCommand(string Email) : IRequest<AuthTokenDeliveryDto>;
