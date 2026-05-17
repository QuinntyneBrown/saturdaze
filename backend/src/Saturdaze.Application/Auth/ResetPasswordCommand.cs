using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Auth;

public record ResetPasswordCommand(string Token, string Password) : IRequest<AuthSuccessDto>;
