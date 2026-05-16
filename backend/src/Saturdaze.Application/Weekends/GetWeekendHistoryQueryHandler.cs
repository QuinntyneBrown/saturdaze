using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Weekends;

public sealed class GetWeekendHistoryQueryHandler
    : IRequestHandler<GetWeekendHistoryQuery, IReadOnlyList<WeekendSummaryDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;

    public GetWeekendHistoryQueryHandler(IAppDbContext db, ICurrentFamilyAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task<IReadOnlyList<WeekendSummaryDto>> Handle(
        GetWeekendHistoryQuery request,
        CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        var weekends = await _db.Weekends.AsNoTracking()
            .Where(w => w.FamilyId == familyId)
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
                    .ToList()
            })
            .ToListAsync(cancellationToken);

        return weekends
            .Select(w => new WeekendSummaryDto(
                w.Id, w.WeekendOf, w.IsFavourite, w.RegenerateCount, w.BlockCount, w.Highlights,
                w.Title, w.Rating))
            .ToList();
    }
}
