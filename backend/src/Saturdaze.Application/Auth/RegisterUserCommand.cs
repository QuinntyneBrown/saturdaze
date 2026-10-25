using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Auth;

/// <param name="OwnerName">The owner's first name; with <paramref name="OwnerAge"/> it puts them in "Who's in" (L2-215).</param>
public record RegisterUserCommand(
    string Email,
    string Password,
    string? FamilyName,
    string? HomeLocation,
    bool FridayPreview = true,
    string? OwnerName = null,
    int? OwnerAge = null
) : IRequest<AuthSuccessDto>;
