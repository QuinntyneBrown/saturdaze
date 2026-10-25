using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Catalog;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Families;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Ideas;

/// <summary>An idea as the placement needs it: how long it takes and where it is.</summary>
public sealed record ResolvedIdea(
    IdeaKind Kind,
    Guid Id,
    string Name,
    int DurationMinutes,
    int DriveMinutes,
    GeoLocation? Geo,
    IReadOnlyList<string>? Themes = null);

/// <summary>
/// Finds an idea in the shared catalogs (L2-107 AC5). Only activities and published
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
    private readonly FamilyBoundariesReader _boundaries;

    public IdeaResolver(IAppDbContext db, FamilyBoundariesReader boundaries)
    {
        _db = db;
        _boundaries = boundaries;
    }

    /// <summary>
    /// The idea as this family sees it: its drive from the family's home, refused when it
    /// is past the family's max drive (L2-190, L2-191).
    /// </summary>
    public async Task<ResolvedIdea> ResolveForFamilyAsync(IdeaKind kind, Guid id, Guid familyId, CancellationToken ct)
    {
        var idea = await ResolveAsync(kind, id, ct);
        var boundaries = await _boundaries.ReadAsync(familyId, ct);
        if (boundaries.Excludes(idea.Themes ?? Array.Empty<string>()))
            throw new ConflictException("excluded_theme", $"{idea.Name} has a theme your family leaves out.");
        var drive = boundaries.DriveMinutes(idea.Geo, idea.DriveMinutes);
        if (drive > boundaries.MaxDriveMinutes)
            throw new ConflictException("beyond_max_drive",
                $"{idea.Name} is {drive} minutes away, past your {boundaries.MaxDriveMinutes}-minute max drive.");
        return idea with { DriveMinutes = drive };
    }

    public async Task<ResolvedIdea> ResolveAsync(IdeaKind kind, Guid id, CancellationToken ct)
    {
        if (kind == IdeaKind.Activity)
        {
            var a = await _db.Activities.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct)
                ?? throw new NotFoundException("Idea", id);
            var minutes = a.TypicalDurationMinutes > 0 ? a.TypicalDurationMinutes : DefaultActivityMinutes;
            return new ResolvedIdea(kind, a.Id, a.Name, minutes, a.DriveMinutes, a.Geo, ThemeTagger.Of(a));
        }

        var e = await _db.LocalEvents.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("Idea", id);
        return new ResolvedIdea(kind, e.Id, e.Name, EventMinutes, e.DriveMinutes, e.Geo, ThemeTagger.Of(e));
    }
}
