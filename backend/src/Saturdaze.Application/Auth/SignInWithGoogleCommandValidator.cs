using FluentValidation;

namespace Saturdaze.Application.Auth;

public class SignInWithGoogleCommandValidator : AbstractValidator<SignInWithGoogleCommand>
{
    public SignInWithGoogleCommandValidator()
    {
        RuleFor(x => x.Credential).NotEmpty();
    }
}
