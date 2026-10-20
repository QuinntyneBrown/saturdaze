namespace Saturdaze.Application.Exceptions;

/// <summary>The caller has used up a per-user quota (429 with <see cref="Code"/>).</summary>
public sealed class TooManyRequestsException : Exception
{
    public string Code { get; }

    public TooManyRequestsException(string code, string message) : base(message)
    {
        Code = code;
    }
}
