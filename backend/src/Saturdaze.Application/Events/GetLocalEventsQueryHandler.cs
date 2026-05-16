using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Events;

public sealed class GetLocalEventsQueryHandler
    : IRequestHandler<GetLocalEventsQuery, IReadOnlyList<LocalEventDto>>
{
    private readonly IAppDbContext _db;

    public GetLocalEventsQueryHandler(IAppDbContext db) => _db = db;

    public async Task<IReadOnlyList<LocalEventDto>> Handle(
        GetLocalEventsQuery request,
        CancellationToken cancellationToken)
    {
        var sat = request.WeekendOf;
        var sun = sat.AddDays(1);

        var rows = await _db.LocalEvents.AsNoTracking()
            .Where(e => e.DriveMinutes <= request.MaxDriveMinutes
                        && e.StartsOn <= sun
                        && e.EndsOn >= sat)
            .OrderBy(e => e.StartsOn).ThenBy(e => e.DriveMinutes).ThenBy(e => e.Name)
            .ToListAsync(cancellationToken);

        return rows
            .Select(e => new LocalEventDto(
                e.Id, e.Name, e.StartsOn, e.EndsOn, e.Location, e.DriveMinutes, e.Url, e.Category))
            .ToList();
    }
}
