using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Weather;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Ideas;

/// <summary>
/// Adds an idea to a day of the family's weekend (L2-107 AC3): the displaced blocks go,
/// the idea's drive, visit and drive back come in, and the day is renumbered. The new
/// block is unlocked; locking it stays the family's choice.
/// </summary>
public sealed class AddIdeaToWeekendCommandHandler : IRequestHandler<AddIdeaToWeekendCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IdeaResolver _ideas;
    private readonly WeekendForecastService _forecast;

    public AddIdeaToWeekendCommandHandler(
        IAppDbContext db, ICurrentFamilyAccessor current, IdeaResolver ideas, WeekendForecastService forecast)
    {
        _db = db;
        _current = current;
        _ideas = ideas;
        _forecast = forecast;
    }

    public async Task<WeekendDto> Handle(AddIdeaToWeekendCommand request, CancellationToken ct)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(ct);
        var weekend = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .FirstOrDefaultAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, ct)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);
        var idea = await _ideas.ResolveAsync(request.IdeaKind, request.IdeaId, ct);

        var day = weekend.Blocks.Where(b => b.Day == request.Day).ToList();
        var placement = IdeaPlacementService.Place(day, idea, request.Timing);
        if (!placement.Fits)
            throw new ConflictException("no_slot", placement.Reason ?? "There is no room for this on that day.");

        foreach (var gone in placement.Replaced)
        {
            weekend.Blocks.Remove(gone);
            _db.ItineraryBlocks.Remove(gone);
        }

        foreach (var block in NewBlocks(weekend.Id, request.Day, idea, placement))
        {
            weekend.Blocks.Add(block);
            _db.ItineraryBlocks.Add(block);
        }

        var sort = 0;
        foreach (var b in weekend.Blocks.Where(b => b.Day == request.Day).OrderBy(b => b.StartTime))
            b.SortOrder = ++sort;

        await _db.SaveChangesAsync(ct);
        var forecast = await _forecast.GetAsync(weekend.WeekendOf, ct);
        return WeekendMapper.ToDto(weekend, forecast);
    }

    private static IEnumerable<ItineraryBlock> NewBlocks(
        Guid weekendId, DayOfWeekend day, ResolvedIdea idea, IdeaPlacement placement)
    {
        if (idea.DriveMinutes > 0)
        {
            yield return new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                WeekendId = weekendId,
                Day = day,
                StartTime = placement.Start.AddMinutes(-idea.DriveMinutes),
                EndTime = placement.Start,
                Kind = BlockKind.Drive,
                Title = $"Drive to {idea.Name}",
                Reason = $"{idea.DriveMinutes} min drive",
            };
        }

        yield return new ItineraryBlock
        {
            Id = Guid.NewGuid(),
            WeekendId = weekendId,
            Day = day,
            StartTime = placement.Start,
            EndTime = placement.End,
            Kind = BlockKind.Activity,
            Title = idea.Name,
            RefId = idea.Id,
            Reason = "Added by the family",
            Stop = idea.Geo?.Copy(),
        };

        if (idea.DriveMinutes > 0)
        {
            yield return new ItineraryBlock
            {
                Id = Guid.NewGuid(),
                WeekendId = weekendId,
                Day = day,
                StartTime = placement.End,
                EndTime = placement.End.AddMinutes(idea.DriveMinutes),
                Kind = BlockKind.Drive,
                Title = $"Drive home from {idea.Name}",
                Reason = $"{idea.DriveMinutes} min drive",
            };
        }
    }
}
