namespace Saturdaze.Application.Exceptions;

public sealed class AuthFlowException : Exception
{
    public int StatusCode { get; }
    public string Code { get; }

    public AuthFlowException(int statusCode, string code, string message)
        : base(message)
    {
        StatusCode = statusCode;
        Code = code;
    }
}
