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

    public GenerateWeekendCommandHandler(
        IAppDbContext db,
        ICurrentFamilyAccessor current,
        IWeekendPlanner planner,
        PlannerInputLoader loader,
        WeekendForecastService forecast)
    {
        _db = db;
        _current = current;
        _planner = planner;
        _loader = loader;
        _forecast = forecast;
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
            var existingForecast = await _forecast.GetAsync(existing.WeekendOf, cancellationToken);
            return WeekendMapper.ToDto(existing, existingForecast);
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
                SortOrder = b.SortOrder
            }).ToList()
        };
        _db.Weekends.Add(weekend);
        await _db.SaveChangesAsync(cancellationToken);

        return WeekendMapper.ToDto(weekend, ctx.Forecast);
    }
}
