using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Auth;

public record LoginCommand(string Email, string Password) : IRequest<AuthSuccessDto>;
