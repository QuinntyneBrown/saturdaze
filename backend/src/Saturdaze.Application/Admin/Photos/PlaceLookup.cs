using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.Photos;

/// <summary>Resolves a (kind, id) pair to the catalog row's name; the three catalogs live in separate tables.</summary>
public static class PlaceLookup
{
    public static async Task<string?> NameAsync(IAppDbContext db, PlaceKind kind, Guid id, CancellationToken ct) => kind switch
    {
        PlaceKind.Activity => await db.Activities.AsNoTracking().Where(a => a.Id == id).Select(a => a.Name).FirstOrDefaultAsync(ct),
        PlaceKind.Restaurant => await db.Restaurants.AsNoTracking().Where(r => r.Id == id).Select(r => r.Name).FirstOrDefaultAsync(ct),
        PlaceKind.LocalEvent => await db.LocalEvents.AsNoTracking().Where(e => e.Id == id).Select(e => e.Name).FirstOrDefaultAsync(ct),
        _ => null,
    };

    /// <summary>How many weekends chose this place's photo as their cover (a number only, ADR-008).</summary>
    public static Task<int> CoverImpactAsync(IAppDbContext db, PlaceKind kind, Guid id, CancellationToken ct) =>
        db.Weekends.AsNoTracking()
            .CountAsync(w => w.CoverSource == CoverSource.Stop && w.CoverPlaceKind == kind && w.CoverPlaceId == id, ct);
}
