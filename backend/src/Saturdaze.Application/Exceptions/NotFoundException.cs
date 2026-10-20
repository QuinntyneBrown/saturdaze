namespace Saturdaze.Application.Exceptions;

public sealed class NotFoundException : Exception
{
    /// <summary>An optional code clients can branch on (e.g. <c>suggestion_not_found</c>); null for a plain 404.</summary>
    public string? Code { get; }

    public NotFoundException(string entity, object key)
        : base($"{entity} with id '{key}' was not found.") { }

    public NotFoundException(string message) : base(message) { }

    public NotFoundException(string code, string message, bool coded)
        : base(message)
    {
        Code = coded ? code : null;
    }
}
