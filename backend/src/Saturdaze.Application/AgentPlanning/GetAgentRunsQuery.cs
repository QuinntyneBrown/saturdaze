using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.AgentPlanning;

/// <summary>One run as Saturdaze Admin lists it (L2-208, L2-210): outcome, usage, cost and trace; no family data.</summary>
public sealed record AgentRunDto(
    Guid Id,
    DateOnly WeekendOf,
    AgentRunTrigger Trigger,
    AgentRunStatus Status,
    AgentFallbackReason? FallbackReason,
    DateTimeOffset QueuedUtc,
    DateTimeOffset? StartedUtc,
    DateTimeOffset? FinishedUtc,
    int Rounds,
    int ModelCalls,
    int ToolCalls,
    int WebSearches,
    int InputTokens,
    int OutputTokens,
    decimal CostUsd,
    string? TraceId,
    int PolicyViolations);

public sealed record AgentRunTotalsDto(int RunsToday, int AppliedToday, int FellBackToday, decimal SpendThisMonthUsd, decimal MonthlyCapUsd);

public sealed record AgentRunsDto(IReadOnlyList<AgentRunDto> Runs, AgentRunTotalsDto Totals);

/// <summary><c>GET /api/admin/agent-runs?take=</c>: the latest runs and today's and this month's totals (administrators only).</summary>
public sealed record GetAgentRunsQuery(int Take = 50) : IRequest<AgentRunsDto>;

public sealed class GetAgentRunsQueryHandler : IRequestHandler<GetAgentRunsQuery, AgentRunsDto>
{
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;
    private readonly AgentPlanningOptions _options;

    public GetAgentRunsQueryHandler(IAppDbContext db, IDateTimeProvider clock, IOptions<AgentPlanningOptions> options)
    {
        _db = db;
        _clock = clock;
        _options = options.Value;
    }

    public async Task<AgentRunsDto> Handle(GetAgentRunsQuery request, CancellationToken ct)
    {
        var take = Math.Clamp(request.Take, 1, 200);
        var now = _clock.UtcNow;
        var startOfDay = new DateTimeOffset(now.UtcDateTime.Date, TimeSpan.Zero);
        var startOfMonth = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);

        // SQLite cannot order by DateTimeOffset; this table stays small (60 a day at most).
        var recent = (await _db.AgentRuns.AsNoTracking().Where(r => r.QueuedUtc >= startOfMonth.AddMonths(-1)).ToListAsync(ct))
            .OrderByDescending(r => r.QueuedUtc).ThenByDescending(r => r.StartedUtc).ToList();
        var today = recent.Where(r => r.StartedUtc >= startOfDay).ToList();

        return new AgentRunsDto(
            recent.Take(take).Select(r => new AgentRunDto(
                r.Id, r.WeekendOf, r.Trigger, r.Status, r.FallbackReason, r.QueuedUtc, r.StartedUtc, r.FinishedUtc,
                r.Rounds, r.ModelCalls, r.ToolCalls, r.WebSearches, r.InputTokens, r.OutputTokens, r.CostUsd, r.TraceId,
                r.PolicyViolations?.Split('\n', StringSplitOptions.RemoveEmptyEntries).Length ?? 0)).ToList(),
            new AgentRunTotalsDto(
                today.Count,
                today.Count(r => r.Status == AgentRunStatus.Applied),
                today.Count(r => r.Status == AgentRunStatus.FellBack),
                recent.Where(r => r.QueuedUtc >= startOfMonth).Sum(r => r.CostUsd),
                _options.MonthlySpendCapUsd));
    }
}
