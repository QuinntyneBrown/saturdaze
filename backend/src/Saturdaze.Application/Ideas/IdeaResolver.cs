using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Ideas;

/// <summary>An idea as the placement needs it: how long it takes and where it is.</summary>
public sealed record ResolvedIdea(
    IdeaKind Kind,
    Guid Id,
    string Name,
    int DurationMinutes,
    int DriveMinutes,
    GeoLocation? Geo);

/// <summary>
/// Finds an idea in the shared catalogs (L2-095 AC5). Only activities and published
/// local events qualify; a pending submission is never a local event, so another
/// family's suggestion is not found.
/// </summary>
public sealed class IdeaResolver
{
    /// <summary>Events carry no duration; plan them as a two-hour visit.</summary>
    public const int EventMinutes = 120;

    /// <summary>Activities without a typical duration get the same.</summary>
    public const int DefaultActivityMinutes = 120;

    private readonly IAppDbContext _db;

    public IdeaResolver(IAppDbContext db) => _db = db;

    public async Task<ResolvedIdea> ResolveAsync(IdeaKind kind, Guid id, CancellationToken ct)
    {
        if (kind == IdeaKind.Activity)
        {
            var a = await _db.Activities.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct)
                ?? throw new NotFoundException("Idea", id);
            var minutes = a.TypicalDurationMinutes > 0 ? a.TypicalDurationMinutes : DefaultActivityMinutes;
            return new ResolvedIdea(kind, a.Id, a.Name, minutes, a.DriveMinutes, a.Geo);
        }

        var e = await _db.LocalEvents.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("Idea", id);
        return new ResolvedIdea(kind, e.Id, e.Name, EventMinutes, e.DriveMinutes, e.Geo);
    }
}
