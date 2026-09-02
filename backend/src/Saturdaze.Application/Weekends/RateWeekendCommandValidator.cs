using FluentValidation;

namespace Saturdaze.Application.Weekends;

public sealed class RateWeekendCommandValidator : AbstractValidator<RateWeekendCommand>
{
    public RateWeekendCommandValidator()
    {
        RuleFor(x => x.Rating)
            .InclusiveBetween(1, 5)
            .When(x => x.Rating.HasValue)
            .WithMessage("Rating must be between 1 and 5 stars.");
    }
}
