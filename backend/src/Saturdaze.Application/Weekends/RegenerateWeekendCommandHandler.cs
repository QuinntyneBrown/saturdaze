using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Planning;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Weekends;

public sealed class RegenerateWeekendCommandHandler : IRequestHandler<RegenerateWeekendCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IWeekendPlanner _planner;
    private readonly PlannerInputLoader _loader;

    public RegenerateWeekendCommandHandler(
        IAppDbContext db,
        ICurrentFamilyAccessor current,
        IWeekendPlanner planner,
        PlannerInputLoader loader)
    {
        _db = db;
        _current = current;
        _planner = planner;
        _loader = loader;
    }

    public async Task<WeekendDto> Handle(RegenerateWeekendCommand request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, cancellationToken)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);

        // Commitments are re-materialised from the family profile every time,
        // so they are never carried over as "locked" here (L2-011 AC2).
        var lockedBlocks = weekend.Blocks
            .Where(b => b.IsLocked && b.Kind != BlockKind.Commitment)
            .ToList();

        var ctx = await _loader.LoadAsync(familyId, weekend.WeekendOf, cancellationToken);

        weekend.RegenerateCount++;
        var seed = weekend.WeekendOf.DayNumber + weekend.RegenerateCount * 31;

        var pendingErrand = weekend.Errands.FirstOrDefault(e => !e.Done);
        var planned = _planner.Plan(ctx.ToInputs(lockedBlocks, pendingErrand, seed));

        // Remove all non-locked blocks; keep locked.
        var lockedIds = lockedBlocks.Select(b => b.Id).ToHashSet();
        foreach (var b in weekend.Blocks.Where(b => !lockedIds.Contains(b.Id)).ToList())
        {
            weekend.Blocks.Remove(b);
            _db.ItineraryBlocks.Remove(b);
        }

        // Planner output includes locked blocks (added by BuildFixedBlocks). Skip those when adding.
        foreach (var b in planned.Where(p => !lockedIds.Contains(p.Id)))
        {
            _db.ItineraryBlocks.Add(new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                WeekendId = weekend.Id,
                Day = b.Day,
                StartTime = b.StartTime,
                EndTime = b.EndTime,
                Kind = b.Kind,
                Title = b.Title,
                RefId = b.RefId,
                IsLocked = b.IsLocked,
                Reason = b.Reason,
                SortOrder = b.SortOrder
            });
        }

        await _db.SaveChangesAsync(cancellationToken);

        return WeekendMapper.ToDto(weekend, ctx.Forecast);
    }
}
