using FluentValidation;
using MediatR;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.PhotoSuggestions;

/// <summary>
/// One photo search (L2-157). <see cref="Target"/> is the client's word (<c>weekendCover</c>,
/// <c>place</c>, <c>profile</c>); the handler resolves it to <see cref="PhotoSuggestionTarget"/>.
/// </summary>
public sealed record FindPhotoSuggestionsCommand(
    string? Target,
    Guid? WeekendId,
    PlaceKind? Kind,
    Guid? PlaceId,
    string? Query) : IRequest<PhotoSuggestionsDto>
{
    public static PhotoSuggestionTarget? ParseTarget(string? target) => target?.Trim().ToLowerInvariant() switch
    {
        "weekendcover" => PhotoSuggestionTarget.WeekendCover,
        "place" => PhotoSuggestionTarget.Place,
        "profile" => PhotoSuggestionTarget.Profile,
        _ => null,
    };
}

public sealed class FindPhotoSuggestionsCommandValidator : AbstractValidator<FindPhotoSuggestionsCommand>
{
    public FindPhotoSuggestionsCommandValidator()
    {
        RuleFor(c => c.Target)
            .Must(t => FindPhotoSuggestionsCommand.ParseTarget(t) is not null)
            .OverridePropertyName("target").WithMessage("Target must be weekendCover, place or profile.");
        RuleFor(c => c.Query).MaximumLength(PhotoSuggestionOptions.MaxQueryLength).OverridePropertyName("query");
        When(c => FindPhotoSuggestionsCommand.ParseTarget(c.Target) == PhotoSuggestionTarget.Profile, () =>
        {
            RuleFor(c => c.Query)
                .Must(q => !string.IsNullOrWhiteSpace(q) && q.Trim().Length >= PhotoSuggestionOptions.MinQueryLength)
                .OverridePropertyName("query").WithMessage("Describe the photo in at least 3 characters.");
        });
        When(c => FindPhotoSuggestionsCommand.ParseTarget(c.Target) == PhotoSuggestionTarget.WeekendCover, () =>
        {
            RuleFor(c => c.WeekendId).NotEmpty().OverridePropertyName("weekendId");
        });
        When(c => FindPhotoSuggestionsCommand.ParseTarget(c.Target) == PhotoSuggestionTarget.Place, () =>
        {
            RuleFor(c => c.Kind).NotNull().OverridePropertyName("kind");
            RuleFor(c => c.PlaceId).NotEmpty().OverridePropertyName("placeId");
        });
    }
}
