using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Planning;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Blocks;

public sealed class SwapBlockCommandHandler : IRequestHandler<SwapBlockCommand, WeekendDto>
{
    public const string NoAlternativeReason = "no alternative available — kept this pick";

    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IWeekendPlanner _planner;
    private readonly PlannerInputLoader _loader;

    public SwapBlockCommandHandler(
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

    public async Task<WeekendDto> Handle(SwapBlockCommand request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .SingleOrDefaultAsync(
                w => w.FamilyId == familyId && w.Blocks.Any(b => b.Id == request.BlockId),
                cancellationToken)
            ?? throw new NotFoundException(nameof(ItineraryBlock), request.BlockId);

        var target = weekend.Blocks.Single(b => b.Id == request.BlockId);

        if (target.Kind != BlockKind.Activity)
            throw new ConflictException("block_not_swappable", "Only activity blocks can be swapped.");
        if (target.IsLocked)
            throw new ConflictException("block_locked", "Locked blocks cannot be swapped. Unlock first.");

        var dayBlocks = weekend.Blocks.Where(b => b.Day == target.Day).OrderBy(b => b.StartTime).ToList();
        var adjacentDrives = dayBlocks
            .Where(b => b.Kind == BlockKind.Drive && (b.EndTime == target.StartTime || b.StartTime == target.EndTime))
            .ToList();
        var window = (start: adjacentDrives.Concat(new[] { target }).Min(b => b.StartTime),
                      end:   adjacentDrives.Concat(new[] { target }).Max(b => b.EndTime));

        var ctx = await _loader.LoadAsync(familyId, weekend.WeekendOf, cancellationToken);
        var dayForecast = ctx.ForecastFor(target.Day);

        // Never offer what the client rejected, what is already on the
        // weekend, or the activity being swapped away.
        var rejected = new HashSet<Guid>(request.RejectedActivityIds ?? Array.Empty<Guid>());
        foreach (var onWeekend in weekend.Blocks.Where(b => b.Kind == BlockKind.Activity && b.RefId is not null))
            rejected.Add(onWeekend.RefId!.Value);
        if (target.RefId is Guid currentActivityId) rejected.Add(currentActivityId);

        var inputs = ctx.ToInputs(
            lockedBlocks: Array.Empty<ItineraryBlock>(),
            errand: null,
            seed: weekend.WeekendOf.DayNumber + (request.RejectedActivityIds?.Count ?? 0) + 1);

        var pick = _planner.PickActivityForGap(inputs, target.Day, window.start, window.end, rejected);
        if (pick is null)
        {
            // L2-015 AC3: nothing left to offer is a no-op, not an error.
            if (!target.Reason.Contains(NoAlternativeReason, StringComparison.Ordinal))
                target.Reason = string.IsNullOrWhiteSpace(target.Reason)
                    ? NoAlternativeReason
                    : $"{target.Reason}; {NoAlternativeReason}";
            await _db.SaveChangesAsync(cancellationToken);
            return WeekendMapper.ToDto(weekend, ctx.Forecast);
        }

        var newBlocks = _planner.BuildActivityBlocks(
            pick, target.Day, window.start, window.end, dayForecast, tryNew: false);

        // Remove the target and the adjacent drive blocks; add new replacements.
        foreach (var old in adjacentDrives)
        {
            weekend.Blocks.Remove(old);
            _db.ItineraryBlocks.Remove(old);
        }
        weekend.Blocks.Remove(target);
        _db.ItineraryBlocks.Remove(target);
        var nextSort = weekend.Blocks.Where(b => b.Day == target.Day).Max(b => (int?)b.SortOrder) ?? 0;
        foreach (var nb in newBlocks)
        {
            _db.ItineraryBlocks.Add(new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                WeekendId = weekend.Id,
                Day = nb.Day,
                StartTime = nb.StartTime,
                EndTime = nb.EndTime,
                Kind = nb.Kind,
                Title = nb.Title,
                RefId = nb.RefId,
                Reason = "swap pick: " + nb.Reason,
                SortOrder = ++nextSort
            });
        }
        await _db.SaveChangesAsync(cancellationToken);

        return WeekendMapper.ToDto(weekend, ctx.Forecast);
    }
}
