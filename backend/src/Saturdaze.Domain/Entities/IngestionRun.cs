using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

/// <summary>
/// Audit record for one <c>saturdaze ingest</c> pass over one catalog type.
/// One row is written per (invocation, type). Rows are append-then-close: the
/// runner inserts the row with <see cref="Status"/> = <see cref="IngestionStatus.Running"/>
/// and updates it once with the final status and counts. Nothing in the product
/// reads this table; it exists for cost/quality forensics.
/// </summary>
public class IngestionRun
{
    public Guid Id { get; set; }

    /// <summary>When the runner opened the row.</summary>
    public DateTimeOffset StartedUtc { get; set; }

    /// <summary>Null while running; set when the runner closes the row.</summary>
    public DateTimeOffset? FinishedUtc { get; set; }

    public IngestionType Type { get; set; }

    public IngestionStatus Status { get; set; }

    /// <summary>How many rows the parser found in the model response.</summary>
    public int ItemsConsidered { get; set; }

    /// <summary>Insert + update count from the upserter.</summary>
    public int ItemsUpserted { get; set; }

    /// <summary>Rows the parser or upserter refused (bad schema, constraint, over-long field).</summary>
    public int ItemsRejected { get; set; }

    /// <summary>From the model's <c>usage.input_tokens</c>.</summary>
    public int InputTokens { get; set; }

    /// <summary>From the model's <c>usage.output_tokens</c>.</summary>
    public int OutputTokens { get; set; }

    /// <summary>How many <c>web_search</c> tool calls the model issued.</summary>
    public int WebSearchCount { get; set; }

    /// <summary>First exception message when <see cref="Status"/> is <see cref="IngestionStatus.Failed"/>.</summary>
    public string? ErrorMessage { get; set; }
}
