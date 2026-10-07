using FluentValidation;
using MediatR;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>
/// An administrator's decision on an unreviewed provider photo (L2-120): <c>keep</c> marks it
/// reviewed, <c>primary</c> also makes it the place's only primary, <c>reject</c> deletes it and
/// records its address so ingestion never stores it again.
/// </summary>
public sealed record ReviewPhotoCommand(Guid PhotoId, string? Decision, string? Reason) : IRequest
{
    public const string Keep = "keep";
    public const string Primary = "primary";
    public const string Reject = "reject";
    public static readonly IReadOnlyList<string> Decisions = new[] { Keep, Primary, Reject };
}

public sealed class ReviewPhotoCommandValidator : AbstractValidator<ReviewPhotoCommand>
{
    public ReviewPhotoCommandValidator()
    {
        RuleFor(c => c.Decision)
            .Must(d => d is not null && ReviewPhotoCommand.Decisions.Contains(d.Trim().ToLowerInvariant()))
            .WithName("decision")
            .WithMessage("Decision must be keep, primary or reject.");
        RuleFor(c => c.Reason).MaximumLength(500).WithName("reason");
    }
}
