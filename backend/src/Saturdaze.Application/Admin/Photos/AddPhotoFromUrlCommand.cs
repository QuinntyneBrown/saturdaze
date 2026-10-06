using FluentValidation;
using MediatR;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>A curated photo added by its allow-listed HTTPS address (L2-116); the source URL is stored, not a copy.</summary>
public sealed record AddPhotoFromUrlCommand(
    PlaceKind Kind,
    Guid PlaceId,
    string? Url,
    string? Alt,
    string? Attribution,
    string? Licence) : IRequest<AdminPhotoDto>;

public sealed class AddPhotoFromUrlCommandValidator : AbstractValidator<AddPhotoFromUrlCommand>
{
    public AddPhotoFromUrlCommandValidator()
    {
        RuleFor(c => c.Url).NotEmpty().MaximumLength(1000).WithName("url").WithMessage("Enter the image address.");
        RuleFor(c => c.Alt).MaximumLength(300).WithName("alt");
        RuleFor(c => c.Attribution).NotEmpty().MaximumLength(300).WithName("attribution")
            .WithMessage("Attribution is required.");
        RuleFor(c => c.Licence).NotEmpty().MaximumLength(120).WithName("licence")
            .WithMessage("Licence is required.");
    }
}
