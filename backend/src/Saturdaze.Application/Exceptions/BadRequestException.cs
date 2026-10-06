namespace Saturdaze.Application.Exceptions;

/// <summary>
/// A request that is well-formed but breaks a business rule; surfaces as a 400
/// ProblemDetails carrying <see cref="Code"/> (e.g. <c>location_required</c>).
/// </summary>
public sealed class BadRequestException : Exception
{
    public string Code { get; }

    public BadRequestException(string code, string message) : base(message)
    {
        Code = code;
    }
}
