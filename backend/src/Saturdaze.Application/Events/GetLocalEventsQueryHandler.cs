using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Events;

public sealed class GetLocalEventsQueryHandler
    : IRequestHandler<GetLocalEventsQuery, IReadOnlyList<LocalEventDto>>
{
    /// <summary>Days after Sunday that still count as "coming soon" (L2-020).</summary>
    public const int ComingSoonDays = 14;

    private readonly IAppDbContext _db;

    public GetLocalEventsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<LocalEventDto>> Handle(
        GetLocalEventsQuery request,
        CancellationToken cancellationToken)
    {
        var fri = request.WeekendOf.AddDays(-1);
        var sun = request.WeekendOf.AddDays(1);
        var comingSoonUntil = sun.AddDays(ComingSoonDays);

        var rows = await _db.LocalEvents.AsNoTracking()
            .Where(e => e.DriveMinutes <= request.MaxDriveMinutes
                        && ((e.StartsOn <= sun && e.EndsOn >= fri)
                            || (e.StartsOn > sun && e.StartsOn <= comingSoonUntil)))
            .OrderBy(e => e.StartsOn).ThenBy(e => e.DriveMinutes).ThenBy(e => e.Name)
            .ToListAsync(cancellationToken);

        return rows
            .Select(e => new LocalEventDto(
                e.Id, e.Name, e.StartsOn, e.EndsOn, e.Location, e.DriveMinutes, e.Url, e.Category))
            .ToList();
    }
}
