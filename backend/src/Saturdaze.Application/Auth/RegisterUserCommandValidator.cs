using FluentValidation;

namespace Saturdaze.Application.Auth;

public class RegisterUserCommandValidator : AbstractValidator<RegisterUserCommand>
{
    public RegisterUserCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).WithMessage("Password must be at least 8 characters.");

        // The owner's name and age go together and are validated as a member's are (L2-215).
        RuleFor(x => x.OwnerName).NotNull().When(x => x.OwnerAge is not null)
            .WithMessage("Give your first name with your age.");
        RuleFor(x => x.OwnerAge).NotNull().When(x => x.OwnerName is not null)
            .WithMessage("Give your age with your first name.");
        RuleFor(x => x.OwnerName!).Must(n => n.Trim().Length is >= 1 and <= 100)
            .When(x => x.OwnerName is not null)
            .WithMessage("Your first name must be 1 to 100 characters.");
        RuleFor(x => x.OwnerAge!.Value).InclusiveBetween(0, 120).When(x => x.OwnerAge is not null)
            .OverridePropertyName(nameof(RegisterUserCommand.OwnerAge));
    }
}
