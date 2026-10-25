using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Exceptions;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.AgentPlanning;

/// <summary>The latest run for a weekend, as the Weekend page reads it (L2-203, L2-205).</summary>
public sealed record AgentDraftDto(
    Guid RunId,
    AgentRunStatus Status,
    AgentRunTrigger Trigger,
    DateTimeOffset RequestedUtc,
    DateTimeOffset? FinishedUtc,
    AgentFallbackReason? FallbackReason,
    string? Notice)
{
    public static AgentDraftDto From(AgentRun run) => new(
        run.Id, run.Status, run.Trigger, run.QueuedUtc, run.FinishedUtc, run.FallbackReason, AgentDraftNotice.For(run.FallbackReason));
}

/// <summary><c>POST /api/weekends/{id}/drafts</c>: queue an on-demand draft of the caller's weekend (L2-203).</summary>
public sealed record RequestWeekendDraftCommand(Guid WeekendId) : IRequest<AgentDraftDto>;

public sealed class RequestWeekendDraftCommandHandler : IRequestHandler<RequestWeekendDraftCommand, AgentDraftDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;
    private readonly IDateTimeProvider _clock;
    private readonly WeekendDraftRunner _runner;
    private readonly AgentPlanningOptions _options;

    public RequestWeekendDraftCommandHandler(
        IAppDbContext db, ICurrentFamilyAccessor current, IDateTimeProvider clock, WeekendDraftRunner runner,
        IOptions<AgentPlanningOptions> options)
    {
        _db = db;
        _current = current;
        _clock = clock;
        _runner = runner;
        _options = options.Value;
    }

    public async Task<AgentDraftDto> Handle(RequestWeekendDraftCommand request, CancellationToken ct)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(ct);
        var weekend = await _db.Weekends.AsNoTracking()
            .SingleOrDefaultAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, ct)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);

        if (weekend.WeekendOf.AddDays(1) < _clock.Today)
            throw new ConflictException("weekend_past", "This weekend is over; there is nothing left to draft.");

        var runs = await _db.AgentRuns.AsNoTracking()
            .Where(r => r.FamilyId == familyId && r.WeekendOf == weekend.WeekendOf)
            .ToListAsync(ct);
        if (runs.Any(r => r.Status is AgentRunStatus.Queued or AgentRunStatus.Running))
            throw new ConflictException("draft_in_progress", "The agents are already drafting this weekend.");
        if (runs.Count(r => r.Trigger == AgentRunTrigger.OnDemand) >= _options.MaxOnDemandRunsPerWeekend)
            throw new TooManyRequestsException("draft_limit",
                $"This weekend has had {_options.MaxOnDemandRunsPerWeekend} drafts already. Try again next weekend.");

        var run = await _runner.QueueAsync(familyId, weekend.WeekendOf, AgentRunTrigger.OnDemand, ct);
        return AgentDraftDto.From(run);
    }
}

/// <summary><c>GET /api/weekends/{id}/drafts/latest</c>: the latest run for the caller's weekend.</summary>
public sealed record GetLatestWeekendDraftQuery(Guid WeekendId) : IRequest<AgentDraftDto>;

public sealed class GetLatestWeekendDraftQueryHandler : IRequestHandler<GetLatestWeekendDraftQuery, AgentDraftDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentFamilyAccessor _current;

    public GetLatestWeekendDraftQueryHandler(IAppDbContext db, ICurrentFamilyAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task<AgentDraftDto> Handle(GetLatestWeekendDraftQuery request, CancellationToken ct)
    {
        var familyId = await _current.GetCurrentFamilyIdAsync(ct);
        var weekend = await _db.Weekends.AsNoTracking()
            .SingleOrDefaultAsync(w => w.Id == request.WeekendId && w.FamilyId == familyId, ct)
            ?? throw new NotFoundException(nameof(Weekend), request.WeekendId);
        var run = await LatestAsync(_db, familyId, weekend.WeekendOf, ct)
            ?? throw new NotFoundException("AgentRun", request.WeekendId);
        return AgentDraftDto.From(run);
    }

    public static async Task<AgentRun?> LatestAsync(IAppDbContext db, Guid familyId, DateOnly weekendOf, CancellationToken ct) =>
        (await db.AgentRuns.AsNoTracking()
            .Where(r => r.FamilyId == familyId && r.WeekendOf == weekendOf)
            .ToListAsync(ct))
        .OrderByDescending(r => r.QueuedUtc).ThenByDescending(r => r.StartedUtc).FirstOrDefault();
}
