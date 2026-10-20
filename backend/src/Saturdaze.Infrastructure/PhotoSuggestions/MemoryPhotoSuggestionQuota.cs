using Microsoft.Extensions.Caching.Memory;
using Saturdaze.Application.Common;
using Saturdaze.Application.PhotoSuggestions;

namespace Saturdaze.Infrastructure.PhotoSuggestions;

/// <summary>A rolling-hour count of searches per user, kept in memory (L2-157 AC7).</summary>
public sealed class MemoryPhotoSuggestionQuota : IPhotoSuggestionQuota
{
    private static readonly TimeSpan Window = TimeSpan.FromHours(1);
    private readonly IMemoryCache _cache;
    private readonly IDateTimeProvider _clock;
    private readonly object _gate = new();

    public MemoryPhotoSuggestionQuota(IMemoryCache cache, IDateTimeProvider clock)
    {
        _cache = cache;
        _clock = clock;
    }

    public bool TryTake(Guid userId, int perHour)
    {
        var key = "photo-suggestion-quota:" + userId.ToString("N");
        var now = _clock.UtcNow;
        lock (_gate)
        {
            var stamps = _cache.GetOrCreate(key, entry =>
            {
                entry.SlidingExpiration = Window;
                entry.Size = 1;
                return new List<DateTimeOffset>();
            })!;
            stamps.RemoveAll(t => t <= now - Window);
            if (stamps.Count >= perHour) return false;
            stamps.Add(now);
            return true;
        }
    }
}
