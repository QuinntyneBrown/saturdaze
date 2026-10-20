using Microsoft.Extensions.Caching.Memory;
using Saturdaze.Application.PhotoSuggestions;

namespace Saturdaze.Infrastructure.PhotoSuggestions;

/// <summary>
/// Suggestions live in the API's memory for their lifetime (L2-157): nothing is written to disk
/// or the database until a person keeps one. A second API instance would need a shared cache
/// behind the same port (ADR-019).
/// </summary>
public sealed class MemoryPhotoSuggestionStore : IPhotoSuggestionStore
{
    private readonly IMemoryCache _cache;

    public MemoryPhotoSuggestionStore(IMemoryCache cache) => _cache = cache;

    private static string Key(string id) => "photo-suggestion:" + id;

    public void Add(PhotoSuggestion suggestion, TimeSpan lifetime) =>
        _cache.Set(Key(suggestion.Id), suggestion, new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = lifetime,
            Size = suggestion.Content.Length,
        });

    public PhotoSuggestion? Get(string id) =>
        _cache.TryGetValue(Key(id), out PhotoSuggestion? suggestion) ? suggestion : null;

    public PhotoSuggestion? Take(string id, Guid userId)
    {
        var suggestion = Get(id);
        return suggestion is not null && suggestion.UserId == userId ? suggestion : null;
    }
}
