using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Families;
using Saturdaze.Application.Photos;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Activities;

public sealed class GetActivitySuggestionsQueryHandler
    : IRequestHandler<GetActivitySuggestionsQuery, IReadOnlyList<ActivityDto>>
{
    /// <summary>Activities used in the last N weekends are excluded when TryNew = true.</summary>
    public const int RecentWeekendWindow = 4;

    /// <summary>Members this age or older are parents, not children (matches the Family page).</summary>
    public const int AdultAge = 18;

    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IPlacePhotoReader? _photos;
    private readonly FamilyBoundariesReader? _boundaries;

    public GetActivitySuggestionsQueryHandler(
        IAppDbContext db, ICurrentFamilyAccessor current, IPlacePhotoReader? photos = null,
        FamilyBoundariesReader? boundaries = null)
    {
        _db = db;
        _current = current;
        _photos = photos;
        _boundaries = boundaries;
    }

    public async Task<IReadOnlyList<ActivityDto>> Handle(
        GetActivitySuggestionsQuery request,
        CancellationToken cancellationToken)
    {
        var query = _db.Activities.AsNoTracking().AsQueryable();

        if (request.Indoor is { } indoor) query = query.Where(a => a.Indoor == indoor);

        // Age window semantics: the activity must welcome everyone in
        // [minAge, maxAge]. With only one bound supplied it still must not top
        // out below (or start above) that bound (L2-017 AC2).
        if (request.MinAge is { } minAge) query = query.Where(a => a.MinAge <= minAge && a.MaxAge >= minAge);
        if (request.MaxAge is { } maxAge) query = query.Where(a => a.MaxAge >= maxAge && a.MinAge <= maxAge);

        // Ideas for the family welcome its youngest and oldest child (L2-145).
        if (request.ForFamily)
        {
            var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);
            var kidAges = await _db.FamilyMembers
                .Where(m => m.FamilyId == familyId && m.Age < AdultAge)
                .Select(m => m.Age)
                .ToListAsync(cancellationToken);
            if (kidAges.Count > 0)
            {
                var youngest = kidAges.Min();
                var oldest = kidAges.Max();
                query = query.Where(a => a.MinAge <= youngest && a.MaxAge >= oldest);
            }
        }

        var activities = await query.ToListAsync(cancellationToken);

        // The family's own drives and limit (L2-190, L2-191): never past the family's max drive.
        var boundaries = _boundaries is null ? null : await _boundaries.ReadCurrentAsync(cancellationToken);
        if (boundaries is not null)
            foreach (var a in activities) a.DriveMinutes = boundaries.DriveMinutes(a.Geo, a.DriveMinutes);
        var limit = Math.Min(request.MaxDriveMinutes ?? int.MaxValue, boundaries?.MaxDriveMinutes ?? int.MaxValue);
        activities = activities.Where(a => a.DriveMinutes <= limit).ToList();

        if (request.Weather is { } weather && !string.IsNullOrWhiteSpace(weather))
        {
            activities = activities
                .Where(a => a.WeatherTags.Any(t => string.Equals(t, weather, StringComparison.OrdinalIgnoreCase)))
                .ToList();
        }

        if (request.TryNew)
        {
            // The family is only needed for the novelty filter.
            var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);
            var recentIds = await _db.Weekends
                .Where(w => w.FamilyId == familyId)
                .OrderByDescending(w => w.WeekendOf)
                .Take(RecentWeekendWindow)
                .SelectMany(w => w.Blocks
                    .Where(b => b.Kind == BlockKind.Activity && b.RefId.HasValue)
                    .Select(b => b.RefId!.Value))
                .Distinct()
                .ToListAsync(cancellationToken);
            var recentSet = recentIds.ToHashSet();
            activities = activities.Where(a => !recentSet.Contains(a.Id)).ToList();
        }

        var page = activities
            .OrderBy(a => a.DriveMinutes)
            .ThenBy(a => a.Name)
            .Take(request.Take)
            .ToList();
        var photos = _photos is null
            ? new Dictionary<Guid, PlacePhotoDto>()
            : await _photos.PrimaryPhotosAsync(
                PlaceKind.Activity, page.Select(a => (a.Id, a.Name)).ToList(), cancellationToken);

        return page
            .Select(a => new ActivityDto(
                a.Id, a.Name, a.Category, a.Indoor, a.MinAge, a.MaxAge, a.DriveMinutes,
                a.WeatherTags.ToList(), a.TypicalDurationMinutes, a.Description, a.MapUrl,
                LocationDto.From(a.Geo),
                photos.GetValueOrDefault(a.Id)))
            .ToList();
    }
}
