using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Travel;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.Families;

/// <summary>
/// What a family's lists and Ideas keep to (L2-190, L2-191, L2-194): drives from its own
/// home, its max drive and the themes it leaves out.
/// </summary>
public sealed record FamilyBoundaries(GeoLocation? Home, int MaxDriveMinutes, IReadOnlySet<string> ExcludedThemes)
{
    public int DriveMinutes(GeoLocation? place, int stored) => FamilyDriveTime.Minutes(Home, place, stored);

    public bool Excludes(IEnumerable<string> themes) => themes.Any(ExcludedThemes.Contains);
}

public sealed class FamilyBoundariesReader
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;

    public FamilyBoundariesReader(IAppDbContext db, ICurrentFamilyAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task<FamilyBoundaries> ReadCurrentAsync(CancellationToken ct)
        => await ReadAsync(await _current.GetCurrentFamilyIdAsync(ct), ct);

    public async Task<FamilyBoundaries> ReadAsync(Guid familyId, CancellationToken ct)
    {
        var family = await _db.Families.AsNoTracking().SingleAsync(f => f.Id == familyId, ct);
        return new FamilyBoundaries(
            family.HomeCoordinates?.Copy(),
            family.MaxDriveMinutes,
            family.ExcludedThemes.ToHashSet(StringComparer.OrdinalIgnoreCase));
    }
}
