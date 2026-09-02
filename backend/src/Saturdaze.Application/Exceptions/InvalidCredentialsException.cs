namespace Saturdaze.Application.Exceptions;

/// <summary>
/// Raised by the login, refresh and current-user flows. Always mapped to HTTP 401
/// with a `{ code, message }` body. The default message is deliberately generic
/// so login never leaks whether an account exists.
/// </summary>
public class InvalidCredentialsException : Exception
{
    public string Code { get; }

    public InvalidCredentialsException(string code = "invalid_credentials", string? message = null)
        : base(message ?? "Email or password is incorrect.")
    {
        Code = code;
    }
}
