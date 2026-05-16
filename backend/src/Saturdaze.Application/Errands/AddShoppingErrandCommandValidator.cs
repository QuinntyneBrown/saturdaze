using FluentValidation;

namespace Saturdaze.Application.Errands;

public sealed class AddShoppingErrandCommandValidator : AbstractValidator<AddShoppingErrandCommand>
{
    public AddShoppingErrandCommandValidator()
    {
        RuleFor(x => x.Description).NotEmpty().MaximumLength(300);
        RuleFor(x => x.EstimatedMinutes).InclusiveBetween(10, 240);
    }
}
