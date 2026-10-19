using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Weather;
using Saturdaze.Application.Weekends;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Ingestion;

/// <summary>
/// Orchestrates a single ingestion pass. For each requested catalog type it
/// opens an <see cref="IngestionRun"/> audit row, asks the web-search client for
/// fresh rows, parses and upserts them, and closes the row with the final
/// status, counts, and token usage. The only class that knows the workflow;
/// every collaborator is a single-step utility, which keeps this testable with
/// fakes.
/// </summary>
public sealed class IngestionRunner
{
    /// <summary>What a run records when the provider gave nothing to work with (L2-080 AC6).</summary>
    public const string NoUsableItems = "The provider returned no usable items.";

    private const int ErrorMessageMaxLength = 2000;

    private readonly IWebSearchClient _client;
    private readonly IngestionResultParser _parser;
    private readonly CatalogUpserter _upserter;
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;
    private readonly HomeLocationOptions _home;
    private readonly IngestionOptions _options;
    private readonly ILogger<IngestionRunner> _logger;

    public IngestionRunner(
        IWebSearchClient client,
        IngestionResultParser parser,
        CatalogUpserter upserter,
        IAppDbContext db,
        IDateTimeProvider clock,
        IOptions<HomeLocationOptions> home,
        IOptions<IngestionOptions> options,
        ILogger<IngestionRunner> logger)
    {
        _client = client;
        _parser = parser;
        _upserter = upserter;
        _db = db;
        _clock = clock;
        _home = home.Value;
        _options = options.Value;
        _logger = logger;
    }

    /// <summary>
    /// Runs ingestion for each requested type in turn. Each type is independent:
    /// a failure on one does not abort the others. With <paramref name="dryRun"/>
    /// the model is still called and the response parsed, but nothing is written
    /// to any table (no catalog rows, no audit row) so prompts can be tuned
    /// without side effects.
    /// </summary>
    public async Task<IReadOnlyList<IngestionRun>> RunAsync(
        IReadOnlyList<IngestionType> types, bool dryRun, CancellationToken cancellationToken)
    {
        var context = new IngestionContext(
            string.IsNullOrWhiteSpace(_home.Name) ? "Port Credit, Mississauga, ON" : _home.Name,
            _options.MaxDriveMinutes,
            GetCurrentWeekendQueryHandler.ResolveUpcomingSaturday(_clock.Today));

        var runs = new List<IngestionRun>(types.Count);
        foreach (var type in types)
        {
            runs.Add(await RunOneAsync(type, context, dryRun, cancellationToken));
        }
        return runs;
    }

    private async Task<IngestionRun> RunOneAsync(
        IngestionType type, IngestionContext context, bool dryRun, CancellationToken ct)
    {
        var run = new IngestionRun
        {
            Id = Guid.NewGuid(),
            StartedUtc = _clock.UtcNow,
            Type = type,
            Status = IngestionStatus.Running
        };

        if (!dryRun)
        {
            // Count and open under one lock so concurrent passes and replicas
            // take turns against the daily budget (L2-080 AC7).
            await using (await _db.AcquireLockAsync($"saturdaze-ingestion-{type}", ct))
            {
                if (await ExceedsDailyBudgetAsync(type, ct))
                {
                    run.Status = IngestionStatus.Failed;
                    run.ErrorMessage = $"Daily run budget of {_options.MaxRunsPerDayPerType} reached for {type}; skipping to avoid runaway API spend.";
                    run.FinishedUtc = _clock.UtcNow;
                    _db.IngestionRuns.Add(run);
                    await _db.SaveChangesAsync(ct);
                    _logger.LogWarning("{Message}", run.ErrorMessage);
                    return run;
                }

                _db.IngestionRuns.Add(run);
                await _db.SaveChangesAsync(ct); // persist the open row before the long call
            }
        }

        try
        {
            var system = IngestionPrompts.BuildSystemPrompt(type, context);
            var user = IngestionPrompts.BuildUserPrompt(type, context);

            _logger.LogInformation("Ingesting {Type} for weekend {Weekend} near {Home}...",
                type, context.ThisWeekend, context.HomeLocation);

            var search = await _client.SearchAsync(system, user, ct);
            run.InputTokens = search.InputTokens;
            run.OutputTokens = search.OutputTokens;
            run.WebSearchCount = search.WebSearchCount;

            var parsed = _parser.Parse(search.RawText, type);
            run.ItemsConsidered = parsed.Considered;

            if (parsed.Considered == 0)
            {
                // Nothing to judge is not a success (L2-080 AC6).
                run.Status = IngestionStatus.Failed;
                run.ErrorMessage = NoUsableItems;
                _logger.LogWarning("{Type}: {Message}", type, NoUsableItems);
            }
            else if (dryRun)
            {
                run.ItemsRejected = parsed.Rejected;
                run.Status = parsed.Rejected > 0 ? IngestionStatus.PartialSuccess : IngestionStatus.Succeeded;
                _logger.LogInformation(
                    "[dry-run] {Type}: parsed {Valid} valid / {Considered} considered ({Rejected} rejected); writes skipped.",
                    type, parsed.Items.Count, parsed.Considered, parsed.Rejected);
            }
            else
            {
                var upsert = await _upserter.UpsertAsync(parsed.Items, type, ct, commit: false);
                run.ItemsUpserted = upsert.Upserted;
                run.ItemsRejected = parsed.Rejected + upsert.Rejected;
                if (upsert.SkipReasons.Count > 0)
                {
                    var reasons = string.Join('\n', upsert.SkipReasons);
                    run.SkipReasons = reasons.Length > 4000 ? reasons[..4000] : reasons;
                }
                run.Status = run.ItemsRejected > 0 ? IngestionStatus.PartialSuccess : IngestionStatus.Succeeded;
                _logger.LogInformation(
                    "{Type}: {Inserted} inserted, {Updated} updated, {Rejected} rejected ({Searches} searches, {In}+{Out} tokens).",
                    type, upsert.Inserted, upsert.Updated, run.ItemsRejected, run.WebSearchCount, run.InputTokens, run.OutputTokens);
            }

            run.FinishedUtc = _clock.UtcNow;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // Close the row before stopping, so it is not left Running (L2-080 AC5).
            if (!dryRun) await RecordFailureAsync(run, "Cancelled.");
            throw;
        }
        catch (Exception ex)
        {
            run.Status = IngestionStatus.Failed;
            run.ErrorMessage = Truncate(ex.Message, ErrorMessageMaxLength);
            run.FinishedUtc = _clock.UtcNow;
            _logger.LogError(ex, "Ingestion failed for {Type}.", type);
        }

        if (!dryRun)
        {
            try
            {
                // The catalog changes and the closed row commit together (L2-080 AC4).
                await _db.SaveChangesAsync(ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(ex, "Ingestion for {Type} could not be saved.", type);
                await RecordFailureAsync(run, Truncate(ex.Message, ErrorMessageMaxLength));
            }
        }

        return run;
    }

    /// <summary>
    /// Drops whatever the type left pending and stores the run as Failed on its
    /// own, so a bad save neither half-commits nor stops the next type.
    /// </summary>
    private async Task RecordFailureAsync(IngestionRun run, string message)
    {
        _db.DiscardChanges();
        run.Status = IngestionStatus.Failed;
        run.ErrorMessage = message;
        run.FinishedUtc = _clock.UtcNow;
        run.ItemsUpserted = 0;
        _db.IngestionRuns.Update(run);
        await _db.SaveChangesAsync(CancellationToken.None);
    }

    /// <summary>The process exit code for a run-once pass (L2-083 AC3).</summary>
    public static int ExitCodeFor(IEnumerable<IngestionRun> runs)
        => runs.Any(r => r.Status == IngestionStatus.Failed) ? 1 : 0;

    private async Task<bool> ExceedsDailyBudgetAsync(IngestionType type, CancellationToken ct)
    {
        var startOfDayUtc = new DateTimeOffset(_clock.UtcNow.UtcDateTime.Date, TimeSpan.Zero);
        var today = await _db.IngestionRuns
            .CountAsync(r => r.Type == type && r.StartedUtc >= startOfDayUtc, ct);
        return today >= _options.MaxRunsPerDayPerType;
    }

    private static string Truncate(string value, int max)
        => value.Length <= max ? value : value[..max];
}
