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

        if (!dryRun && await ExceedsDailyBudgetAsync(type, ct))
        {
            run.Status = IngestionStatus.Failed;
            run.ErrorMessage = $"Daily run budget of {_options.MaxRunsPerDayPerType} reached for {type}; skipping to avoid runaway API spend.";
            run.FinishedUtc = _clock.UtcNow;
            _db.IngestionRuns.Add(run);
            await _db.SaveChangesAsync(ct);
            _logger.LogWarning("{Message}", run.ErrorMessage);
            return run;
        }

        if (!dryRun)
        {
            _db.IngestionRuns.Add(run);
            await _db.SaveChangesAsync(ct); // persist the open row before the long call
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

            if (dryRun)
            {
                run.ItemsRejected = parsed.Rejected;
                run.Status = parsed.Rejected > 0 ? IngestionStatus.PartialSuccess : IngestionStatus.Succeeded;
                _logger.LogInformation(
                    "[dry-run] {Type}: parsed {Valid} valid / {Considered} considered ({Rejected} rejected); writes skipped.",
                    type, parsed.Items.Count, parsed.Considered, parsed.Rejected);
            }
            else
            {
                var upsert = await _upserter.UpsertAsync(parsed.Items, type, ct);
                run.ItemsUpserted = upsert.Upserted;
                run.ItemsRejected = parsed.Rejected + upsert.Rejected;
                run.Status = run.ItemsRejected > 0 ? IngestionStatus.PartialSuccess : IngestionStatus.Succeeded;
                _logger.LogInformation(
                    "{Type}: {Inserted} inserted, {Updated} updated, {Rejected} rejected ({Searches} searches, {In}+{Out} tokens).",
                    type, upsert.Inserted, upsert.Updated, run.ItemsRejected, run.WebSearchCount, run.InputTokens, run.OutputTokens);
            }

            run.FinishedUtc = _clock.UtcNow;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            run.Status = IngestionStatus.Failed;
            run.ErrorMessage = Truncate(ex.Message, ErrorMessageMaxLength);
            run.FinishedUtc = _clock.UtcNow;
            _logger.LogError(ex, "Ingestion failed for {Type}.", type);
        }

        if (!dryRun)
            await _db.SaveChangesAsync(ct); // close the row

        return run;
    }

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
