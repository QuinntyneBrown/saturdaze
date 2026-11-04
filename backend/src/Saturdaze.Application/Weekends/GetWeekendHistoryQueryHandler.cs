using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Covers;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Weekends;

public sealed class GetWeekendHistoryQueryHandler
    : IRequestHandler<GetWeekendHistoryQuery, WeekendHistoryPage>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly WeekendEnrichment _enrichment;
    private readonly IDateTimeProvider _clock;

    public GetWeekendHistoryQueryHandler(
        IAppDbContext db, ICurrentFamilyAccessor current, WeekendEnrichment enrichment, IDateTimeProvider clock)
    {
        _db = db;
        _current = current;
        _enrichment = enrichment;
        _clock = clock;
    }

    public async Task<WeekendHistoryPage> Handle(
        GetWeekendHistoryQuery request,
        CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        // Past means before the current weekend, which /weekend still owns (L2-025 AC4).
        var currentWeekend = GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday(_clock.Today);
        var past = _db.Weekends.AsNoTracking()
            .Where(w => w.FamilyId == familyId && w.WeekendOf < currentWeekend);
        var total = await past.CountAsync(cancellationToken);
        if (request.Before is { } before) past = past.Where(w => w.WeekendOf < before);

        var weekends = await past
            .OrderByDescending(w => w.WeekendOf)
            .Take(request.Take)
            .Select(w => new
            {
                w.Id,
                w.WeekendOf,
                w.IsFavourite,
                w.RegenerateCount,
                w.Title,
                w.Rating,
                BlockCount = w.Blocks.Count,
                Highlights = w.Blocks
                    .Where(b => b.Kind == BlockKind.Activity)
                    .OrderBy(b => b.Day).ThenBy(b => b.StartTime)
                    .Select(b => b.Title)
                    .ToList(),
                // The stops a cover can come from (L2-110).
                Stops = w.Blocks
                    .Where(b => b.RefId != null && (b.Kind == BlockKind.Activity || b.Kind == BlockKind.Meal))
                    .Select(b => new ItineraryBlockDto(
                        b.Id, b.Day, b.StartTime, b.EndTime, b.Kind, b.Title, b.RefId, b.IsLocked, b.Reason,
                        b.SortOrder, null, null, null, null))
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        // Each weekend's dates, with who went (L2-225 AC7).
        var ids = weekends.Select(w => w.Id).ToList();
        var dates = await _db.CoupleDates.AsNoTracking().Where(d => ids.Contains(d.WeekendId)).ToListAsync(cancellationToken);
        var restaurantIds = dates.Select(d => d.RestaurantId).Distinct().ToList();
        var restaurants = await _db.Restaurants.AsNoTracking().Where(r => restaurantIds.Contains(r.Id))
            .ToDictionaryAsync(r => r.Id, r => r.Name, cancellationToken);
        var members = await _db.FamilyMembers.AsNoTracking().Where(m => m.FamilyId == familyId)
            .ToDictionaryAsync(m => m.Id, cancellationToken);

        var summaries = new List<WeekendSummaryDto>(weekends.Count);
        foreach (var w in weekends)
        {
            var cover = await _enrichment.CoverAsync(w.Id, w.Stops, cancellationToken);
            summaries.Add(new WeekendSummaryDto(
                w.Id, w.WeekendOf, w.IsFavourite, w.RegenerateCount, w.BlockCount, w.Highlights,
                w.Title, w.Rating, cover,
                dates.Where(d => d.WeekendId == w.Id)
                    .OrderBy(d => d.Day).ThenBy(d => d.StartTime)
                    .Select(d => new DateSummaryDto(
                        d.Day, d.Meal, restaurants.GetValueOrDefault(d.RestaurantId) ?? string.Empty,
                        d.AttendeeMemberIds.Where(members.ContainsKey).Select(id => members[id].Name).ToList()))
                    .ToList()));
        }

        return new WeekendHistoryPage(summaries, total);
    }
}
