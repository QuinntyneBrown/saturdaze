using System.Text.RegularExpressions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Photos;

public sealed partial class ListIngestionPhotoSkipsQueryHandler
    : IRequestHandler<ListIngestionPhotoSkipsQuery, IReadOnlyList<IngestionPhotoSkipsDto>>
{
    public const int MaxRuns = 50;

    private readonly IAppDbContext _db;

    public ListIngestionPhotoSkipsQueryHandler(IAppDbContext db) => _db = db;

    /// <summary><c>{place}: photo {url} skipped, {reason}</c>, as <c>CatalogUpserter</c> writes it.</summary>
    [GeneratedRegex(@"^(?<place>.+?): photo (?<url>\S+) skipped, (?<reason>.+)$")]
    private static partial Regex SkipLine();

    public async Task<IReadOnlyList<IngestionPhotoSkipsDto>> Handle(ListIngestionPhotoSkipsQuery request, CancellationToken ct)
    {
        var runs = await _db.IngestionRuns.AsNoTracking()
            .Where(r => r.SkipReasons != null)
            .OrderByDescending(r => r.StartedUtc)
            .Take(MaxRuns)
            .ToListAsync(ct);

        var result = new List<IngestionPhotoSkipsDto>(runs.Count);
        var namesByKind = new Dictionary<PlaceKind, Dictionary<string, Guid>>();
        foreach (var run in runs)
        {
            var kind = KindOf(run.Type);
            if (!namesByKind.TryGetValue(kind, out var names))
                namesByKind[kind] = names = await NamesAsync(kind, ct);

            var skips = run.SkipReasons!.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(line => Parse(line, kind, names))
                .ToList();
            result.Add(new IngestionPhotoSkipsDto(run.Id, run.StartedUtc, run.Type.ToString(), run.Status.ToString(), skips));
        }
        return result;
    }

    private static IngestionPhotoSkipDto Parse(string line, PlaceKind kind, Dictionary<string, Guid> names)
    {
        var m = SkipLine().Match(line);
        if (!m.Success) return new IngestionPhotoSkipDto(string.Empty, string.Empty, line, null, null);
        var place = m.Groups["place"].Value;
        var found = names.TryGetValue(place, out var id);
        return new IngestionPhotoSkipDto(place, m.Groups["url"].Value, m.Groups["reason"].Value, found ? kind.ToString() : null, found ? id : null);
    }

    private static PlaceKind KindOf(IngestionType type) => type switch
    {
        IngestionType.Activities => PlaceKind.Activity,
        IngestionType.Restaurants => PlaceKind.Restaurant,
        _ => PlaceKind.LocalEvent,
    };

    /// <summary>A run's catalog by name; a name shared by two places links to neither.</summary>
    private async Task<Dictionary<string, Guid>> NamesAsync(PlaceKind kind, CancellationToken ct)
    {
        var pairs = kind switch
        {
            PlaceKind.Activity => await _db.Activities.AsNoTracking().Select(a => new { a.Name, a.Id }).ToListAsync(ct),
            PlaceKind.Restaurant => await _db.Restaurants.AsNoTracking().Select(r => new { r.Name, r.Id }).ToListAsync(ct),
            _ => await _db.LocalEvents.AsNoTracking().Select(e => new { e.Name, e.Id }).ToListAsync(ct),
        };
        return pairs.GroupBy(p => p.Name, StringComparer.Ordinal)
            .Where(g => g.Count() == 1)
            .ToDictionary(g => g.Key, g => g.Single().Id, StringComparer.Ordinal);
    }
}
