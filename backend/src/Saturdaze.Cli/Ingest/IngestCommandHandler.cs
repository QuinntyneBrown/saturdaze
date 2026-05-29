using Microsoft.Extensions.Logging;
using Saturdaze.Application.Ingestion;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Cli.Ingest;

public sealed class IngestCommandHandler
{
    private readonly IngestionRunner _runner;
    private readonly ILogger<IngestCommandHandler> _logger;

    public IngestCommandHandler(IngestionRunner runner, ILogger<IngestCommandHandler> logger)
    {
        _runner = runner;
        _logger = logger;
    }

    public async Task<int> ExecuteAsync(string? typeArg, bool dryRun, CancellationToken ct)
    {
        IReadOnlyList<IngestionType> types;
        try
        {
            types = IngestionTypes.Parse(typeArg);
        }
        catch (ArgumentException ex)
        {
            _logger.LogError("{Message}", ex.Message);
            return 2;
        }

        _logger.LogInformation(
            "Starting ingestion for [{Types}]{DryRun}.",
            string.Join(", ", types),
            dryRun ? " (dry-run)" : string.Empty);

        var runs = await _runner.RunAsync(types, dryRun, ct);

        foreach (var run in runs)
        {
            _logger.LogInformation(
                "  {Type,-11} {Status,-14} considered={Considered} upserted={Upserted} rejected={Rejected} searches={Searches} tokens={In}+{Out}{Error}",
                run.Type, run.Status, run.ItemsConsidered, run.ItemsUpserted, run.ItemsRejected,
                run.WebSearchCount, run.InputTokens, run.OutputTokens,
                run.ErrorMessage is null ? string.Empty : $" — {run.ErrorMessage}");
        }

        var failed = runs.Count(r => r.Status == IngestionStatus.Failed);
        if (failed > 0)
        {
            _logger.LogError("Ingestion finished with {Failed} failed pass(es).", failed);
            return 1;
        }

        _logger.LogInformation("Ingestion complete.");
        return 0;
    }
}
