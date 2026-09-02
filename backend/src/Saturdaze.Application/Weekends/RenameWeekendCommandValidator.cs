using FluentValidation;

namespace Saturdaze.Application.Weekends;

public sealed class RenameWeekendCommandValidator : AbstractValidator<RenameWeekendCommand>
{
    public RenameWeekendCommandValidator()
    {
        RuleFor(x => x.Title).MaximumLength(120);
    }
}
