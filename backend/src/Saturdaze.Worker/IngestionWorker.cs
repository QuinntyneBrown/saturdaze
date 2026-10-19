using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Ingestion;
using Saturdaze.Application.Scheduling;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Worker;

/// <summary>
/// The scheduled trigger for catalog ingestion. A long-lived
/// <see cref="BackgroundService"/> that, on each cron tick, opens a DI scope,
/// resolves the <see cref="IngestionRunner"/>, and runs a real pass — the same
/// runner the <c>saturdaze ingest</c> CLI uses, so the scheduled and on-demand
/// paths are identical. The cron expression is evaluated in UTC by the
/// dependency-free <see cref="CronSchedule"/>.
/// </summary>
public sealed class IngestionWorker : BackgroundService
{
    private static readonly TimeSpan MaxDelayChunk = TimeSpan.FromHours(1);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IngestionScheduleOptions _options;
    private readonly IHostApplicationLifetime _lifetime;
    private readonly ILogger<IngestionWorker> _logger;

    public IngestionWorker(
        IServiceScopeFactory scopeFactory,
        IOptions<IngestionScheduleOptions> options,
        IHostApplicationLifetime lifetime,
        ILogger<IngestionWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _options = options.Value;
        _lifetime = lifetime;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Ingestion worker is disabled (Saturdaze:Ingestion:Schedule:Enabled = false). Idling.");
            return;
        }

        var exitCode = 0;
        if (_options.RunOnStartup || _options.RunOnceThenExit)
            exitCode = await RunIngestionAsync(stoppingToken);

        if (_options.RunOnceThenExit)
        {
            // A scheduler sees a failed pass through the exit code (L2-083 AC3).
            Environment.ExitCode = exitCode;
            _logger.LogInformation("RunOnceThenExit set; ingestion pass complete, stopping host.");
            _lifetime.StopApplication();
            return;
        }

        if (!CronSchedule.TryParse(_options.Cron, out var schedule))
        {
            _logger.LogError("Invalid cron expression '{Cron}'. Worker cannot schedule runs; stopping host.", _options.Cron);
            _lifetime.StopApplication();
            return;
        }

        _logger.LogInformation(
            "Ingestion worker scheduled: cron '{Cron}' (UTC), types '{Types}'.", _options.Cron, _options.Types);

        while (!stoppingToken.IsCancellationRequested)
        {
            DateTimeOffset next;
            try
            {
                next = schedule.GetNextOccurrence(DateTimeOffset.UtcNow);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Could not compute next run for cron '{Cron}'; stopping host.", _options.Cron);
                _lifetime.StopApplication();
                return;
            }

            _logger.LogInformation("Next ingestion run at {Next:u} (in {Delay}).", next, next - DateTimeOffset.UtcNow);

            try
            {
                await DelayUntilAsync(next, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            if (stoppingToken.IsCancellationRequested)
                break;

            await RunIngestionAsync(stoppingToken);
        }
    }

    /// <returns>The exit code a run-once host should report: 1 when any type failed.</returns>
    private async Task<int> RunIngestionAsync(CancellationToken ct)
    {
        try
        {
            var types = IngestionTypes.Parse(_options.Types);

            using var scope = _scopeFactory.CreateScope();
            var runner = scope.ServiceProvider.GetRequiredService<IngestionRunner>();
            var runs = await runner.RunAsync(types, dryRun: false, ct);

            foreach (var run in runs)
            {
                _logger.LogInformation(
                    "  {Type} -> {Status}: considered={Considered} upserted={Upserted} rejected={Rejected} searches={Searches} tokens={In}+{Out}",
                    run.Type, run.Status, run.ItemsConsidered, run.ItemsUpserted, run.ItemsRejected,
                    run.WebSearchCount, run.InputTokens, run.OutputTokens);
            }

            var failed = runs.Count(r => r.Status == IngestionStatus.Failed);
            if (failed > 0)
                _logger.LogWarning("Ingestion pass completed with {Failed} failed type(s).", failed);
            else
                _logger.LogInformation("Ingestion pass completed cleanly.");
            return IngestionRunner.ExitCodeFor(runs);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // Host is shutting down; nothing to do.
            return 0;
        }
        catch (Exception ex)
        {
            // Never let one bad pass kill the worker; the next tick will retry.
            _logger.LogError(ex, "Ingestion pass threw before it could record an audit row.");
            return 1;
        }
    }

    /// <summary>
    /// Waits until <paramref name="when"/>, sleeping in bounded chunks so the
    /// worker stays responsive to shutdown and never trips Task.Delay's range
    /// limit on a far-future schedule.
    /// </summary>
    private static async Task DelayUntilAsync(DateTimeOffset when, CancellationToken ct)
    {
        while (true)
        {
            var remaining = when - DateTimeOffset.UtcNow;
            if (remaining <= TimeSpan.FromMilliseconds(50))
                return;

            await Task.Delay(remaining < MaxDelayChunk ? remaining : MaxDelayChunk, ct);
        }
    }
}
