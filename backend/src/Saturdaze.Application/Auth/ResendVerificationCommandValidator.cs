using FluentValidation;

namespace Saturdaze.Application.Auth;

public sealed class ResendVerificationCommandValidator : AbstractValidator<ResendVerificationCommand>
{
    public ResendVerificationCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().MaximumLength(256);
    }
}
