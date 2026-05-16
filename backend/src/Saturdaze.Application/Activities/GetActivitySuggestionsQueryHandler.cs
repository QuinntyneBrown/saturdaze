using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Activities;

public sealed class GetActivitySuggestionsQueryHandler
    : IRequestHandler<GetActivitySuggestionsQuery, IReadOnlyList<ActivityDto>>
{
    /// <summary>Activities used in the last N weekends are excluded when TryNew = true.</summary>
    public const int RecentWeekendWindow = 4;

    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;

    public GetActivitySuggestionsQueryHandler(IAppDbContext db, ICurrentFamilyAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<ActivityDto>> Handle(
        GetActivitySuggestionsQuery request,
        CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        var query = _db.Activities.AsNoTracking().AsQueryable();

        if (request.Indoor is { } indoor) query = query.Where(a => a.Indoor == indoor);
        if (request.MaxDriveMinutes is { } maxDrive) query = query.Where(a => a.DriveMinutes <= maxDrive);
        if (request.MinAge is { } minAge) query = query.Where(a => a.MinAge <= minAge);
        if (request.MaxAge is { } maxAge) query = query.Where(a => a.MaxAge >= maxAge);

        var activities = await query.ToListAsync(cancellationToken);

        if (request.Weather is { } weather && !string.IsNullOrWhiteSpace(weather))
        {
            activities = activities
                .Where(a => a.WeatherTags.Any(t => string.Equals(t, weather, StringComparison.OrdinalIgnoreCase)))
                .ToList();
        }

        if (request.TryNew)
        {
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

        return activities
            .OrderBy(a => a.DriveMinutes)
            .ThenBy(a => a.Name)
            .Take(request.Take)
            .Select(a => new ActivityDto(
                a.Id, a.Name, a.Category, a.Indoor, a.MinAge, a.MaxAge, a.DriveMinutes,
                a.WeatherTags.ToList(), a.TypicalDurationMinutes, a.Description, a.MapUrl))
            .ToList();
    }
}
