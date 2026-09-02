using FluentValidation;

namespace Saturdaze.Application.EventSubmissions;

public sealed class ApproveSubmissionCommandValidator : AbstractValidator<ApproveSubmissionCommand>
{
    public ApproveSubmissionCommandValidator()
    {
        RuleFor(x => x.DriveMinutes).InclusiveBetween(0, 600).When(x => x.DriveMinutes.HasValue);
    }
}
