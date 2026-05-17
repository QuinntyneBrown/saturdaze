namespace Saturdaze.Application.Exceptions;

public sealed class ConflictException : Exception
{
    public string Code { get; }

    public ConflictException(string message) : base(message)
    {
        Code = "conflict";
    }

    public ConflictException(string code, string message) : base(message)
    {
        Code = code;
    }
}
