using FluentValidation;
using MediatR;
using Saturdaze.Application.Admin.Photos;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Avatars;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Covers;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Photos;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.PhotoSuggestions;

/// <summary>A live suggestion of the caller's becomes the weekend's cover, stored as an upload with its credit (L2-158).</summary>
public sealed record UseSuggestedCoverCommand(Guid WeekendId, string? SuggestionId) : IRequest<WeekendDto>;

/// <summary>A live suggestion of the administrator's joins the curated store like an upload (L2-159).</summary>
public sealed record UseSuggestedCuratedPhotoCommand(
    PlaceKind Kind,
    Guid PlaceId,
    string? SuggestionId,
    string? Alt,
    string? Attribution,
    string? Licence) : IRequest<AdminPhotoDto>;

/// <summary>A live suggestion of the caller's, scaled to 512 px, becomes the profile photo (L2-160).</summary>
public sealed record UseSuggestedAvatarCommand(string? SuggestionId) : IRequest<UserDto>;

public sealed class UseSuggestedCoverCommandValidator : AbstractValidator<UseSuggestedCoverCommand>
{
    public UseSuggestedCoverCommandValidator()
    {
        RuleFor(c => c.SuggestionId).NotEmpty().OverridePropertyName("suggestionId");
    }
}

public sealed class UseSuggestedCuratedPhotoCommandValidator : AbstractValidator<UseSuggestedCuratedPhotoCommand>
{
    public UseSuggestedCuratedPhotoCommandValidator()
    {
        RuleFor(c => c.SuggestionId).NotEmpty().OverridePropertyName("suggestionId");
        RuleFor(c => c.Alt).MaximumLength(300).OverridePropertyName("alt");
        RuleFor(c => c.Attribution).NotEmpty().MaximumLength(300).OverridePropertyName("attribution")
            .WithMessage("Attribution is required.");
        RuleFor(c => c.Licence).NotEmpty().MaximumLength(120).OverridePropertyName("licence")
            .WithMessage("Licence is required.");
    }
}

public sealed class UseSuggestedAvatarCommandValidator : AbstractValidator<UseSuggestedAvatarCommand>
{
    public UseSuggestedAvatarCommandValidator()
    {
        RuleFor(c => c.SuggestionId).NotEmpty().OverridePropertyName("suggestionId");
    }
}

/// <summary>Resolves a suggestion for the caller or throws the 404 every "use" command shares.</summary>
internal static class SuggestionResolver
{
    public static PhotoSuggestion Take(IPhotoSuggestionStore store, ICurrentUserAccessor user, string? id)
    {
        var userId = user.UserId ?? throw new InvalidCredentialsException();
        return store.Take(id!, userId)
            ?? throw new NotFoundException("suggestion_not_found", "That suggestion is no longer available. Search again.", coded: true);
    }
}

public sealed class UseSuggestedCoverCommandHandler : IRequestHandler<UseSuggestedCoverCommand, WeekendDto>
{
    private readonly ISender _sender;
    private readonly IPhotoSuggestionStore _store;
    private readonly ICurrentUserAccessor _user;

    public UseSuggestedCoverCommandHandler(ISender sender, IPhotoSuggestionStore store, ICurrentUserAccessor user)
    {
        _sender = sender;
        _store = store;
        _user = user;
    }

    public Task<WeekendDto> Handle(UseSuggestedCoverCommand request, CancellationToken ct)
    {
        var suggestion = SuggestionResolver.Take(_store, _user, request.SuggestionId);
        return _sender.Send(new UploadWeekendCoverCommand(request.WeekendId, suggestion.Content, suggestion.Attribution), ct);
    }
}

public sealed class UseSuggestedCuratedPhotoCommandHandler : IRequestHandler<UseSuggestedCuratedPhotoCommand, AdminPhotoDto>
{
    private readonly ISender _sender;
    private readonly IPhotoSuggestionStore _store;
    private readonly ICurrentUserAccessor _user;

    public UseSuggestedCuratedPhotoCommandHandler(ISender sender, IPhotoSuggestionStore store, ICurrentUserAccessor user)
    {
        _sender = sender;
        _store = store;
        _user = user;
    }

    public Task<AdminPhotoDto> Handle(UseSuggestedCuratedPhotoCommand request, CancellationToken ct)
    {
        var suggestion = SuggestionResolver.Take(_store, _user, request.SuggestionId);
        return _sender.Send(new UploadCuratedPhotoCommand(
            request.Kind, request.PlaceId, suggestion.Content,
            request.Alt, request.Attribution, request.Licence, suggestion.SourceUrl), ct);
    }
}

public sealed class UseSuggestedAvatarCommandHandler : IRequestHandler<UseSuggestedAvatarCommand, UserDto>
{
    /// <summary>Avatars are small discs; this keeps a suggestion well under the 2 MB rule (L2-087).</summary>
    public const int MaxEdge = 512;

    private readonly ISender _sender;
    private readonly IPhotoSuggestionStore _store;
    private readonly ICurrentUserAccessor _user;
    private readonly IImageSanitizer _sanitizer;

    public UseSuggestedAvatarCommandHandler(ISender sender, IPhotoSuggestionStore store, ICurrentUserAccessor user, IImageSanitizer sanitizer)
    {
        _sender = sender;
        _store = store;
        _user = user;
        _sanitizer = sanitizer;
    }

    public Task<UserDto> Handle(UseSuggestedAvatarCommand request, CancellationToken ct)
    {
        var suggestion = SuggestionResolver.Take(_store, _user, request.SuggestionId);
        var scaled = _sanitizer.Sanitize(suggestion.Content, MaxEdge)
            ?? throw new NotFoundException("suggestion_not_found", "That suggestion is no longer available. Search again.", coded: true);
        return _sender.Send(new SetAvatarCommand(scaled.Content), ct);
    }
}
