namespace Saturdaze.Application.Exceptions;

/// <summary>A limit on how often something may be asked for was reached; answered as 429 with its code.</summary>
public sealed class TooManyRequestsException : Exception
{
    public string Code { get; }

    public TooManyRequestsException(string code, string message) : base(message)
    {
        Code = code;
    }
}
