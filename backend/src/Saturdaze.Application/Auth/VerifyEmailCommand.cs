using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Auth;

public record VerifyEmailCommand(string Token) : IRequest<UserDto>;
