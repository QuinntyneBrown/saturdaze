using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Auth;

public record RegisterUserCommand(
    string Email,
    string Password,
    string? FamilyName,
    string? HomeLocation
) : IRequest<AuthSuccessDto>;
