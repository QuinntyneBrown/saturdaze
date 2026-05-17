using FluentValidation.Results;

namespace Saturdaze.Application.Exceptions;

public sealed class ValidationException : Exception
{
    public IReadOnlyDictionary<string, string[]> Errors { get; }

    public ValidationException(IEnumerable<ValidationFailure> failures)
        : base("One or more validation failures have occurred.")
    {
        Errors = failures
            .GroupBy(f => f.PropertyName)
            .ToDictionary(g => g.Key, g => g.Select(f => f.ErrorMessage).ToArray());
    }

    public ValidationException(string propertyName, string errorMessage)
        : base("One or more validation failures have occurred.")
    {
        Errors = new Dictionary<string, string[]>
        {
            [propertyName] = new[] { errorMessage }
        };
    }
}
