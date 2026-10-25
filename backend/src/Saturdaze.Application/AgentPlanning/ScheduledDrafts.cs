using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.AgentPlanning;

/// <summary>
/// Friday's drafts (L2-203): one run per family with "Friday preview" on, for the upcoming weekend,
/// skipping a family whose weekend the agents drafted in the last six days. <c>saturdaze
/// draft-weekends</c> runs it from the <c>draft</c> WebJob after the morning's ingestion.
/// </summary>
public sealed class ScheduledDrafts
{
    /// <summary>A weekend drafted this recently is not drafted again by the schedule.</summary>
    public const int RedraftAfterDays = 6;

    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;
    private readonly WeekendDraftRunner _runner;
    private readonly ILogger<ScheduledDrafts> _logger;

    public ScheduledDrafts(IAppDbContext db, IDateTimeProvider clock, WeekendDraftRunner runner, ILogger<ScheduledDrafts> logger)
    {
        _db = db;
        _clock = clock;
        _runner = runner;
        _logger = logger;
    }

    public async Task<IReadOnlyList<AgentRun>> RunAsync(CancellationToken ct)
    {
        var weekendOf = GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday(_clock.Today);
        var since = _clock.UtcNow.AddDays(-RedraftAfterDays);
        var families = await _db.Families.AsNoTracking()
            .Where(f => f.FridayPreviewEnabled)
            .Select(f => f.Id)
            .ToListAsync(ct);
        var recentlyDrafted = (await _db.Weekends.AsNoTracking()
                .Where(w => w.WeekendOf == weekendOf && w.PlanSource == PlanSource.Agents)
                .Select(w => w.FamilyId)
                .ToListAsync(ct))
            .Intersect(await _db.AgentRuns.AsNoTracking()
                .Where(r => r.WeekendOf == weekendOf && r.Status == AgentRunStatus.Applied && r.StartedUtc >= since)
                .Select(r => r.FamilyId)
                .ToListAsync(ct))
            .ToHashSet();

        var runs = new List<AgentRun>();
        foreach (var familyId in families.Where(id => !recentlyDrafted.Contains(id)))
        {
            ct.ThrowIfCancellationRequested();
            var run = await _runner.QueueAsync(familyId, weekendOf, AgentRunTrigger.Scheduled, ct);
            runs.Add(await _runner.RunAsync(run.Id, ct));
        }
        _logger.LogInformation("Scheduled drafts for {Weekend}: {Applied} applied, {FellBack} fell back.",
            weekendOf, runs.Count(r => r.Status == AgentRunStatus.Applied), runs.Count(r => r.Status == AgentRunStatus.FellBack));
        return runs;
    }

    /// <summary>The job's exit code: 1 when a run failed with an error, so the scheduler shows it.</summary>
    public static int ExitCodeFor(IEnumerable<AgentRun> runs) =>
        runs.Any(r => r.FallbackReason == AgentFallbackReason.Error) ? 1 : 0;
}
