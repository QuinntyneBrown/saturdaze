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

public sealed class RegenerateWeekendDayCommandHandler
    : IRequestHandler<RegenerateWeekendDayCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IWeekendPlanner _planner;
    private readonly PlannerInputLoader _loader;

    public RegenerateWeekendDayCommandHandler(
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

    public async Task<WeekendDto> Handle(RegenerateWeekendDayCommand request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, cancellationToken)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);

        // The other day is fixed wholesale; on the requested day only locked
        // blocks survive. Commitments come back from the profile either way.
        var fixedBlocks = weekend.Blocks
            .Where(b => (b.Day != request.Day || b.IsLocked) && b.Kind != BlockKind.Commitment)
            .ToList();

        var ctx = await _loader.LoadAsync(familyId, weekend.WeekendOf, cancellationToken);

        weekend.RegenerateCount++;
        var seed = weekend.WeekendOf.DayNumber + weekend.RegenerateCount * 47 + (int)request.Day;
        var planned = _planner.Plan(ctx.ToInputs(fixedBlocks, weekend.Errands.FirstOrDefault(e => !e.Done), seed));

        var fixedIds = fixedBlocks.Select(b => b.Id).ToHashSet();
        foreach (var block in weekend.Blocks
                     .Where(b => b.Day == request.Day && !fixedIds.Contains(b.Id))
                     .ToList())
        {
            weekend.Blocks.Remove(block);
            _db.ItineraryBlocks.Remove(block);
        }

        foreach (var block in planned.Where(b => b.Day == request.Day && !fixedIds.Contains(b.Id)))
        {
            _db.ItineraryBlocks.Add(new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                WeekendId = weekend.Id,
                Day = block.Day,
                StartTime = block.StartTime,
                EndTime = block.EndTime,
                Kind = block.Kind,
                Title = block.Title,
                RefId = block.RefId,
                IsLocked = block.IsLocked,
                Reason = block.Reason,
                SortOrder = block.SortOrder
            });
        }

        await _db.SaveChangesAsync(cancellationToken);
        return WeekendMapper.ToDto(weekend, ctx.Forecast);
    }
}
