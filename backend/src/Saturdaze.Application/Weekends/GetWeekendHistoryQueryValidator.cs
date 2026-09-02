using FluentValidation;

namespace Saturdaze.Application.Weekends;

public sealed class GetWeekendHistoryQueryValidator : AbstractValidator<GetWeekendHistoryQuery>
{
    public GetWeekendHistoryQueryValidator()
    {
        // L2-025 AC2: zero is not a page size.
        RuleFor(x => x.Take).InclusiveBetween(1, 100);
    }
}
