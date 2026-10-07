using FluentValidation;
using MediatR;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>Edits a photo's alt text, attribution and licence; the URL is immutable (L2-118).</summary>
public sealed record EditPhotoDetailsCommand(Guid PhotoId, string? Alt, string? Attribution, string? Licence) : IRequest<AdminPhotoDto>;

public sealed class EditPhotoDetailsCommandValidator : AbstractValidator<EditPhotoDetailsCommand>
{
    public EditPhotoDetailsCommandValidator()
    {
        RuleFor(c => c.Alt).MaximumLength(300).WithName("alt");
        RuleFor(c => c.Attribution).NotEmpty().MaximumLength(300).WithName("attribution")
            .WithMessage("Attribution is required.");
        RuleFor(c => c.Licence).NotEmpty().MaximumLength(120).WithName("licence")
            .WithMessage("Licence is required.");
    }
}
