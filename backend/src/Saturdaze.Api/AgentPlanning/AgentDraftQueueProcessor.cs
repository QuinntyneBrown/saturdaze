using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.AgentPlanning;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Api.AgentPlanning;

/// <summary>
/// Runs on-demand agent drafts off the request path (L2-203, ADR-023): every
/// <see cref="AgentPlanningOptions.QueuePollSeconds"/> it takes the oldest queued run and hands it to
/// <see cref="WeekendDraftRunner"/>, one at a time. The scheduled drafts run in the <c>draft</c> WebJob.
/// </summary>
public sealed class AgentDraftQueueProcessor : BackgroundService
{
    private readonly IServiceScopeFactory _scopes;
    private readonly IOptionsMonitor<AgentPlanningOptions> _options;
    private readonly ILogger<AgentDraftQueueProcessor> _logger;

    public AgentDraftQueueProcessor(
        IServiceScopeFactory scopes, IOptionsMonitor<AgentPlanningOptions> options, ILogger<AgentDraftQueueProcessor> logger)
    {
        _scopes = scopes;
        _options = options;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                while (await RunNextAsync(stoppingToken)) { }
                await Task.Delay(TimeSpan.FromSeconds(Math.Max(1, _options.CurrentValue.QueuePollSeconds)), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                // The database may be briefly unavailable; the next pass tries again.
                _logger.LogError("Agent draft queue pass failed: {Error}", ex.GetType().Name);
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }

    /// <returns>True when a run was processed, so the queue is drained before the next sleep.</returns>
    private async Task<bool> RunNextAsync(CancellationToken ct)
    {
        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var next = (await db.AgentRuns.AsNoTracking()
                .Where(r => r.Status == AgentRunStatus.Queued && r.Trigger == AgentRunTrigger.OnDemand)
                .Select(r => new { r.Id, r.QueuedUtc })
                .ToListAsync(ct))
            .OrderBy(r => r.QueuedUtc).Select(r => (Guid?)r.Id).FirstOrDefault();
        if (next is null) return false;
        await scope.ServiceProvider.GetRequiredService<WeekendDraftRunner>().RunAsync(next.Value, ct);
        return true;
    }
}
