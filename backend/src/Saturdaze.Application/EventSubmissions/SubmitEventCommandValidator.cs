using FluentValidation;

namespace Saturdaze.Application.EventSubmissions;

public sealed class SubmitEventCommandValidator : AbstractValidator<SubmitEventCommand>
{
    public SubmitEventCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.StartsAtLocal).NotEmpty();
        RuleFor(x => x.Location).MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.CostNote).MaximumLength(80);
        RuleFor(x => x.AgeRange).MaximumLength(80);
        RuleFor(x => x.Category).MaximumLength(80);
        RuleFor(x => x.Latitude).InclusiveBetween(-90m, 90m);
        RuleFor(x => x.Longitude).InclusiveBetween(-180m, 180m);
        RuleFor(x => x.Latitude).NotNull().When(x => x.Longitude is not null);
        RuleFor(x => x.Longitude).NotNull().When(x => x.Latitude is not null);
        RuleFor(x => x.Address).MaximumLength(300);
        RuleFor(x => x.SourceUrl)
            .MaximumLength(500)
            .Must(BeAValidHttpUrl)
                .When(x => !string.IsNullOrWhiteSpace(x.SourceUrl))
                .WithMessage("invalid_url")
                .WithErrorCode("invalid_url");
    }

    private static bool BeAValidHttpUrl(string? url)
    {
        if (string.IsNullOrWhiteSpace(url)) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out var parsed)
            && (parsed.Scheme == Uri.UriSchemeHttp || parsed.Scheme == Uri.UriSchemeHttps);
    }
}
