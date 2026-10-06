using FluentValidation;

namespace Saturdaze.Application.Avatars;

public class SetAvatarCommandValidator : AbstractValidator<SetAvatarCommand>
{
    public SetAvatarCommandValidator()
    {
        RuleFor(x => x.Data)
            .Cascade(CascadeMode.Stop)
            .Must(d => d.Length > 0).WithMessage("Choose a photo to upload.")
            .Must(d => d.Length <= AvatarImage.MaxBytes).WithMessage("The photo must be 2 MB or smaller.")
            .Must(d => AvatarImage.DetectContentType(d) is not null)
            .WithMessage("The photo must be a JPG, PNG or WebP image.")
            .OverridePropertyName("file");
    }
}
