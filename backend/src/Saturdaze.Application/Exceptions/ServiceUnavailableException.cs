namespace Saturdaze.Application.Exceptions;

/// <summary>A dependency the request needs is unconfigured or failing (503 with <see cref="Code"/>).</summary>
public sealed class ServiceUnavailableException : Exception
{
    public string Code { get; }

    public ServiceUnavailableException(string code, string message, Exception? inner = null) : base(message, inner)
    {
        Code = code;
    }
}
