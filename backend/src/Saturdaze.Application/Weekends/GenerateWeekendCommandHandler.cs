using MediatR;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Contracts;
using Saturdaze.Application.Planning;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Weekends;

public sealed class GenerateWeekendCommandHandler : IRequestHandler<GenerateWeekendCommand, WeekendDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IWeekendPlanner _planner;
    private readonly PlannerInputLoader _loader;
    private readonly WeekendForecastService _forecast;
    private readonly AgentPlanning.WeekendFactory _factory;

    public GenerateWeekendCommandHandler(
        IAppDbContext db,
        ICurrentFamilyAccessor current,
        IWeekendPlanner planner,
        PlannerInputLoader loader,
        WeekendForecastService forecast,
        AgentPlanning.WeekendFactory factory)
    {
        _db = db;
        _current = current;
        _planner = planner;
        _loader = loader;
        _forecast = forecast;
        _factory = factory;
    }

    public async Task<WeekendDto> Handle(GenerateWeekendCommand request, CancellationToken cancellationToken)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(cancellationToken);

        // Idempotent (ADR-003): if a weekend already exists for this family + date, return it.
        var existing = await _db.Weekends
            .Include(w => w.Blocks)
            .Include(w => w.Errands)
            .FirstOrDefaultAsync(w => w.FamilyId == familyId && w.WeekendOf == request.WeekendOf, cancellationToken);
        if (existing is not null)
        {
            var existingForecast = await _forecast.GetAsync(existing.WeekendOf, existing.Home, cancellationToken);
            return WeekendMapper.ToDto(existing, existingForecast);
        }

        var draft = await _db.WeekendDrafts
            .Where(d => d.FamilyId == familyId && d.WeekendOf == request.WeekendOf && !d.Applied && d.PicksJson != "[]")
            .OrderByDescending(d => d.CreatedUtc)
            .FirstOrDefaultAsync(cancellationToken);
        if (draft is not null)
        {
            var (fromDraft, draftContext) = await _factory.GetOrCreateAsync(familyId, request.WeekendOf, draft, cancellationToken);
            return WeekendMapper.ToDto(fromDraft, draftContext.Forecast);
        }

        var ctx = await _loader.LoadAsync(familyId, request.WeekendOf, cancellationToken);
        var inputs = ctx.ToInputs(
            lockedBlocks: Array.Empty<ItineraryBlock>(),
            errand: null,
            seed: request.WeekendOf.DayNumber);

        var blocks = _planner.Plan(inputs);

        var weekend = new Weekend
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            WeekendOf = request.WeekendOf,
            RegenerateCount = 0,
            Blocks = blocks.Select(b => new ItineraryBlock
            {
                Id = b.Id == Guid.Empty ? Guid.NewGuid() : b.Id,
                Day = b.Day,
                StartTime = b.StartTime,
                EndTime = b.EndTime,
                Kind = b.Kind,
                Title = b.Title,
                RefId = b.RefId,
                IsLocked = b.IsLocked,
                Reason = b.Reason,
                SortOrder = b.SortOrder,
                Stop = b.Stop?.Copy(),
                FromCalendar = b.FromCalendar
            }).ToList(),
            Home = ctx.Home.Copy()
        };
        _db.Weekends.Add(weekend);
        await _db.SaveChangesAsync(cancellationToken);

        return WeekendMapper.ToDto(weekend, ctx.Forecast);
    }
}
