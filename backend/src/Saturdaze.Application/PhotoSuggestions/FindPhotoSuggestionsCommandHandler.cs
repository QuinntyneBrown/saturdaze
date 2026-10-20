using System.Security.Cryptography;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Authentication;
using Saturdaze.Application.Common;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Ingestion;
using Saturdaze.Application.Photos;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.PhotoSuggestions;

/// <summary>
/// One photo search (L2-157): authorize the target, take one search from the caller's quota, ask
/// Claude, parse its answer, fetch and clean each candidate, keep the survivors for a while and
/// hand back signed previews. Candidates that fail any step are dropped without comment.
/// </summary>
public sealed class FindPhotoSuggestionsCommandHandler : IRequestHandler<FindPhotoSuggestionsCommand, PhotoSuggestionsDto>
{
    public const string PreviewBasePath = "/api/photo-suggestions";
    public const string SignaturePrefix = "suggestion:";

    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _user;
    private readonly ICurrentFamilyAccessor _family;
    private readonly IWebSearchClient _search;
    private readonly IPublicImageFetcher _fetcher;
    private readonly IImageSanitizer _sanitizer;
    private readonly IPhotoSuggestionStore _store;
    private readonly IPhotoSuggestionQuota _quota;
    private readonly IPhotoUrlSigner _signer;
    private readonly PhotoSuggestionOptions _options;
    private readonly HomeLocationOptions _home;
    private readonly ILogger<FindPhotoSuggestionsCommandHandler> _logger;

    public FindPhotoSuggestionsCommandHandler(
        IAppDbContext db,
        ICurrentUserAccessor user,
        ICurrentFamilyAccessor family,
        IWebSearchClient search,
        IPublicImageFetcher fetcher,
        IImageSanitizer sanitizer,
        IPhotoSuggestionStore store,
        IPhotoSuggestionQuota quota,
        IPhotoUrlSigner signer,
        IOptions<PhotoSuggestionOptions> options,
        IOptions<HomeLocationOptions> home,
        ILogger<FindPhotoSuggestionsCommandHandler> logger)
    {
        _db = db;
        _user = user;
        _family = family;
        _search = search;
        _fetcher = fetcher;
        _sanitizer = sanitizer;
        _store = store;
        _quota = quota;
        _signer = signer;
        _options = options.Value;
        _home = home.Value;
        _logger = logger;
    }

    public async Task<PhotoSuggestionsDto> Handle(FindPhotoSuggestionsCommand request, CancellationToken ct)
    {
        var userId = _user.UserId ?? throw new InvalidCredentialsException();
        var target = FindPhotoSuggestionsCommand.ParseTarget(request.Target)!.Value;
        var home = string.IsNullOrWhiteSpace(_home.Name) ? "the family's home" : _home.Name;

        // Authorization and the research context, per target (AC4).
        string prompt;
        string context;
        switch (target)
        {
            case PhotoSuggestionTarget.WeekendCover:
            {
                var familyId = await _family.GetCurrentFamilyIdAsync(ct);
                var weekend = await _db.Weekends.AsNoTracking()
                    .Include(w => w.Blocks)
                    .FirstOrDefaultAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, ct)
                    ?? throw new NotFoundException(nameof(Weekend), request.WeekendId!.Value);
                var stops = weekend.Blocks
                    .Where(b => b.RefId is not null && b.Kind is BlockKind.Activity or BlockKind.Meal)
                    .OrderBy(b => b.Day).ThenBy(b => b.SortOrder).ThenBy(b => b.StartTime)
                    .Select(b => (b.Title, b.Stop?.Address))
                    .DistinctBy(s => s.Title)
                    .ToList();
                prompt = PhotoSuggestionPrompt.WeekendCover(weekend.Title, stops, request.Query, home);
                context = weekend.Id.ToString();
                break;
            }
            case PhotoSuggestionTarget.Place:
            {
                if (_user.Role != UserRole.Admin)
                    throw new ForbiddenException("admin_only", "Only an administrator can look for place photos.");
                var kind = request.Kind!.Value;
                var place = await PlaceContextAsync(kind, request.PlaceId!.Value, ct)
                    ?? throw new NotFoundException("Place", request.PlaceId!.Value);
                prompt = PhotoSuggestionPrompt.Place(kind.ToString(), place.Name, place.Address, request.Query, home);
                context = $"{kind} {request.PlaceId}";
                break;
            }
            default:
                prompt = PhotoSuggestionPrompt.Profile(request.Query!);
                context = userId.ToString();
                break;
        }

        if (!_quota.TryTake(userId, _options.SearchesPerHour))
            throw new TooManyRequestsException("suggestion_limit",
                $"You can look for photos {_options.SearchesPerHour} times an hour. Try again later.");

        WebSearchResult answer;
        try
        {
            answer = await _search.SearchAsync(PhotoSuggestionPrompt.System(_options.MaxCandidates), prompt, ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Photo suggestions for {Target} ({Context}) could not reach Claude", target, context);
            throw new ServiceUnavailableException("suggestions_unavailable",
                "Photo suggestions are not available right now. Try again in a moment.", ex);
        }

        var candidates = PhotoSuggestionCandidateParser.Parse(answer.RawText);
        var lifetime = TimeSpan.FromMinutes(_options.LifetimeMinutes);
        var accepted = new List<PhotoSuggestionDto>();
        var fetches = 0;
        foreach (var candidate in candidates)
        {
            // AC2: a blocked address is never fetched; the fetcher repeats the check after DNS resolution.
            if (!Uri.TryCreate(candidate.ImageUrl, UriKind.Absolute, out var url) || !PublicImageAddress.IsCandidate(url))
                continue;
            if (fetches++ >= _options.MaxCandidates) break;
            var suggestion = await FetchAsync(candidate, url, userId, ct);
            if (suggestion is null) continue;
            _store.Add(suggestion, lifetime);
            accepted.Add(new PhotoSuggestionDto(
                suggestion.Id,
                _signer.SignedUrl(SignaturePrefix + suggestion.Id, lifetime, PreviewBasePath),
                suggestion.Width,
                suggestion.Height,
                suggestion.Title,
                suggestion.SourceName,
                suggestion.SourceUrl,
                suggestion.Attribution,
                suggestion.Licence));
        }

        // AC8: counts and usage only, never the bytes.
        _logger.LogInformation(
            "Photo suggestions for {Target} ({Context}): {Candidates} candidates, {Accepted} accepted, {InputTokens} input tokens, {OutputTokens} output tokens, {Searches} searches",
            target, context, candidates.Count, accepted.Count, answer.InputTokens, answer.OutputTokens, answer.WebSearchCount);

        return new PhotoSuggestionsDto(accepted);
    }

    private async Task<PhotoSuggestion?> FetchAsync(PhotoSuggestionCandidate candidate, Uri url, Guid userId, CancellationToken ct)
    {
        var bytes = await _fetcher.FetchAsync(url, ct);
        if (bytes is null) return null;
        var image = _sanitizer.Sanitize(bytes);
        if (image is null) return null;
        return new PhotoSuggestion(
            Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLowerInvariant(),
            userId,
            image.Content,
            image.Width,
            image.Height,
            candidate.Title,
            candidate.SourceName,
            candidate.SourceUrl,
            candidate.Attribution,
            candidate.Licence);
    }

    private async Task<(string Name, string? Address)?> PlaceContextAsync(PlaceKind kind, Guid id, CancellationToken ct)
    {
        switch (kind)
        {
            case PlaceKind.Activity:
            {
                var a = await _db.Activities.AsNoTracking().Where(x => x.Id == id)
                    .Select(x => new { x.Name, Address = x.Geo != null ? x.Geo.Address : null }).FirstOrDefaultAsync(ct);
                return a is null ? null : (a.Name, a.Address);
            }
            case PlaceKind.Restaurant:
            {
                var r = await _db.Restaurants.AsNoTracking().Where(x => x.Id == id)
                    .Select(x => new { x.Name, Address = x.Geo != null ? x.Geo.Address : null }).FirstOrDefaultAsync(ct);
                return r is null ? null : (r.Name, r.Address);
            }
            case PlaceKind.LocalEvent:
            {
                var e = await _db.LocalEvents.AsNoTracking().Where(x => x.Id == id)
                    .Select(x => new { x.Name, Address = x.Geo != null ? x.Geo.Address : null }).FirstOrDefaultAsync(ct);
                return e is null ? null : (e.Name, e.Address);
            }
            default:
                return null;
        }
    }
}
