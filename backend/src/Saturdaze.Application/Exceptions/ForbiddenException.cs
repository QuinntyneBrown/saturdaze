namespace Saturdaze.Application.Exceptions;

/// <summary>The caller is signed in but may not do this (403 with <see cref="Code"/>).</summary>
public sealed class ForbiddenException : Exception
{
    public string Code { get; }

    public ForbiddenException(string code, string message) : base(message)
    {
        Code = code;
    }
}
