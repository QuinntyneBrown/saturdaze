using FluentValidation;

namespace Saturdaze.Application.Weekends;

public sealed class GenerateWeekendCommandValidator : AbstractValidator<GenerateWeekendCommand>
{
    public GenerateWeekendCommandValidator()
    {
        RuleFor(x => x.WeekendOf)
            .Must(d => d.DayOfWeek == DayOfWeek.Saturday)
            .WithMessage("WeekendOf must be a Saturday.");
    }
}
