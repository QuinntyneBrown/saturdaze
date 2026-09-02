using FluentValidation;

namespace Saturdaze.Application.Auth;

public sealed class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().MaximumLength(256);
    }
}
