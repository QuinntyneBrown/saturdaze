using Saturdaze.Application.Exceptions;

namespace Saturdaze.Application.Auth;

/// <summary>
/// The one rule for a new password at registration, reset and invitation
/// acceptance (L2-143): 8 or more characters including a number or symbol.
/// </summary>
public static class PasswordPolicy
{
    public const int MinimumLength = 8;

    public static bool IsSatisfiedBy(string? password) =>
        password is { Length: >= MinimumLength } && password.Any(c => !char.IsLetter(c));

    public static void Enforce(string? password)
    {
        if (!IsSatisfiedBy(password))
            throw new AuthFlowException(400, "weak_password", "Use 8 or more characters, including a number or symbol.");
    }
}
