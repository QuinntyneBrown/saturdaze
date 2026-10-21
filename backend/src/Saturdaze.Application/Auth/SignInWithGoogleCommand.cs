using MediatR;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Auth;

/// <param name="Credential">The Google ID token from Google Identity Services.</param>
public record SignInWithGoogleCommand(string Credential) : IRequest<AuthSuccessDto>;
