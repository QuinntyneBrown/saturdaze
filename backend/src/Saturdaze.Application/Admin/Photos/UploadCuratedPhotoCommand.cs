using FluentValidation;
using MediatR;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>A curated photo uploaded by an administrator (L2-115). Never carries the file name.</summary>
public sealed record UploadCuratedPhotoCommand(
    PlaceKind Kind,
    Guid PlaceId,
    byte[] Content,
    string? Alt,
    string? Attribution,
    string? Licence) : IRequest<AdminPhotoDto>;

public sealed class UploadCuratedPhotoCommandValidator : AbstractValidator<UploadCuratedPhotoCommand>
{
    public UploadCuratedPhotoCommandValidator()
    {
        RuleFor(c => c.Content).NotEmpty().WithName("file").WithMessage("Choose a photo to upload.");
        RuleFor(c => c.Alt).MaximumLength(300).WithName("alt");
        RuleFor(c => c.Attribution).NotEmpty().MaximumLength(300).WithName("attribution")
            .WithMessage("Attribution is required.");
        RuleFor(c => c.Licence).NotEmpty().MaximumLength(120).WithName("licence")
            .WithMessage("Licence is required.");
    }
}
