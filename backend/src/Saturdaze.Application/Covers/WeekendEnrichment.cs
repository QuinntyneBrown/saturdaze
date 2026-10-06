using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Photos;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Covers;

/// <summary>
/// Adds what the static weekend projection cannot read itself: each stop's place photo
/// (block thumbnails and the cover picker) and the resolved cover (L2-096).
/// </summary>
public sealed class WeekendEnrichment
{
    private readonly IAppDbContext _db;
    private readonly IPlacePhotoReader _photos;

    public WeekendEnrichment(IAppDbContext db, IPlacePhotoReader photos)
    {
        _db = db;
        _photos = photos;
    }

    public async Task<WeekendDto> EnrichAsync(WeekendDto weekend, CancellationToken ct)
    {
        var photos = await StopPhotosAsync(weekend.Blocks, ct);
        var blocks = weekend.Blocks
            .Select(b => b.RefId is { } id && photos.TryGetValue(id, out var p) ? b with { Photo = p } : b)
            .ToList();

        var choice = await _db.Weekends.AsNoTracking()
            .Where(w => w.Id == weekend.Id)
            .Select(w => new { w.CoverSource, w.CoverPlaceId })
            .FirstOrDefaultAsync(ct);

        return weekend with { Blocks = blocks, Cover = ResolveCover(blocks, choice?.CoverSource, choice?.CoverPlaceId) };
    }

    /// <summary>Primary photos of the places the weekend's blocks point at, keyed by place id.</summary>
    public async Task<IReadOnlyDictionary<Guid, PlacePhotoDto>> StopPhotosAsync(
        IEnumerable<ItineraryBlockDto> blocks, CancellationToken ct)
    {
        var places = blocks
            .Where(b => b.RefId is not null && b.Kind is BlockKind.Activity or BlockKind.Meal)
            .GroupBy(b => b.RefId!.Value)
            .Select(g => (Id: g.Key, Name: PlaceName(g.First())))
            .ToList();
        var result = new Dictionary<Guid, PlacePhotoDto>();
        if (places.Count == 0) return result;

        foreach (var kind in new[] { PlaceKind.Activity, PlaceKind.LocalEvent, PlaceKind.Restaurant })
        {
            foreach (var (id, photo) in await _photos.PrimaryPhotosAsync(kind, places, ct))
                result.TryAdd(id, photo);
        }

        return result;
    }

    /// <summary>
    /// The chosen stop's photo while that stop is still planned; otherwise the photo of
    /// Saturday's highlight (its first activity), else Sunday's, else none (AC1, AC6).
    /// </summary>
    private static CoverDto? ResolveCover(
        IReadOnlyList<ItineraryBlockDto> blocks, CoverSource? source, Guid? placeId)
    {
        if (source == CoverSource.Stop && placeId is { } chosen)
        {
            var stop = blocks.FirstOrDefault(b => b.RefId == chosen && b.Photo is not null);
            if (stop is not null) return ToCover(stop, "stop");
        }

        var highlight = Highlight(blocks, DayOfWeekend.Saturday) ?? Highlight(blocks, DayOfWeekend.Sunday);
        return highlight is null ? null : ToCover(highlight, "default");
    }

    private static ItineraryBlockDto? Highlight(IReadOnlyList<ItineraryBlockDto> blocks, DayOfWeekend day)
    {
        var first = blocks.Where(b => b.Day == day && b.Kind == BlockKind.Activity)
            .OrderBy(b => b.SortOrder).ThenBy(b => b.StartTime)
            .FirstOrDefault();
        return first?.Photo is null ? null : first;
    }

    private static CoverDto ToCover(ItineraryBlockDto block, string source)
    {
        var p = block.Photo!;
        return new CoverDto(p.Url, p.Width, p.Height, p.Alt, p.Attribution, $"From {PlaceName(block)}", source, block.RefId);
    }

    /// <summary>The place's name: an activity's title, or a meal's restaurant ("Lunch: La Marina").</summary>
    public static string PlaceName(ItineraryBlockDto block)
    {
        var colon = block.Title.IndexOf(": ", StringComparison.Ordinal);
        return block.Kind == BlockKind.Meal && colon >= 0 ? block.Title[(colon + 2)..] : block.Title;
    }
}
