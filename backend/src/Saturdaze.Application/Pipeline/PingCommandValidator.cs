using FluentValidation;

namespace Saturdaze.Application.Pipeline;

public sealed class PingCommandValidator : AbstractValidator<PingCommand>
{
    public PingCommandValidator()
    {
        RuleFor(x => x.Mode)
            .NotEmpty()
            .Must(m => m is "ok" or "notfound" or "conflict")
            .WithMessage("Mode must be one of: ok, notfound, conflict.");
    }
}
