namespace Saturdaze.Application.Exceptions;

public sealed class NotFoundException : Exception
{
    public NotFoundException(string entity, object key)
        : base($"{entity} with id '{key}' was not found.") { }

    public NotFoundException(string message) : base(message) { }
}
