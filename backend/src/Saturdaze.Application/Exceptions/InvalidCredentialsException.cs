namespace Saturdaze.Application.Exceptions;

/// <summary>
/// Raised by the login and refresh flows. Always mapped to HTTP 401 with the
/// generic message "Email or password is incorrect." so we never leak whether
/// an account exists.
/// </summary>
public class InvalidCredentialsException : Exception
{
    public string Code { get; }

    public InvalidCredentialsException(string code = "invalid_credentials")
        : base("Email or password is incorrect.")
    {
        Code = code;
    }
}
