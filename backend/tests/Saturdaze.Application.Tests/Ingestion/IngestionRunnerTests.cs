using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Common;
using Saturdaze.Application.Ingestion;
using Saturdaze.Application.Tests.Support;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Ingestion;

public class IngestionRunnerTests
{
    private static readonly FixedClock Clock = new(new DateTimeOffset(2026, 5, 28, 12, 0, 0, TimeSpan.Zero));

    private const string TwoEvents = """
        [
          {"name":"Tulip Festival","startsOn":"2026-05-30","endsOn":"2026-05-31","location":"RBG","driveMinutes":35,"category":"Festival","url":"https://example.com/source"},
          {"name":"Farmers Market","startsOn":"2026-05-30","endsOn":"2026-05-30","location":"Lakeshore","driveMinutes":2,"category":"Local","url":"https://example.com/source"}
        ]
        """;

    private static IngestionRunner CreateRunner(
        TestApp app, IWebSearchClient client, int maxRunsPerDay = 48)
        => new(
            client,
            new IngestionResultParser(),
            new CatalogUpserter(app.Db),
            app.Db,
            Clock,
            Options.Create(new HomeLocationOptions { Name = "Port Credit, Mississauga, ON" }),
            Options.Create(new IngestionOptions { MaxDriveMinutes = 200, MaxRunsPerDayPerType = maxRunsPerDay }),
            NullLogger<IngestionRunner>.Instance);

    [Fact]
    public async Task Happy_path_upserts_rows_and_records_a_closed_audit_run()
    {
        await using var app = TestApp.Create();
        var client = new FakeWebSearchClient(new WebSearchResult(TwoEvents, InputTokens: 1200, OutputTokens: 240, WebSearchCount: 4));
        var runner = CreateRunner(app, client);

        var runs = await runner.RunAsync(new[] { IngestionType.Events }, dryRun: false, default);

        runs.Should().ContainSingle();
        var run = runs[0];
        run.Status.Should().Be(IngestionStatus.Succeeded);
        run.ItemsConsidered.Should().Be(2);
        run.ItemsUpserted.Should().Be(2);
        run.ItemsRejected.Should().Be(0);
        run.InputTokens.Should().Be(1200);
        run.OutputTokens.Should().Be(240);
        run.WebSearchCount.Should().Be(4);
        run.FinishedUtc.Should().NotBeNull();

        (await app.Db.LocalEvents.CountAsync()).Should().Be(2);
        var persisted = await app.Db.IngestionRuns.SingleAsync();
        persisted.Status.Should().Be(IngestionStatus.Succeeded);
        client.LastSystemPrompt.Should().Contain("Port Credit, Mississauga, ON");
    }

    [Fact]
    public async Task Dry_run_calls_the_model_but_writes_nothing()
    {
        await using var app = TestApp.Create();
        var client = new FakeWebSearchClient(new WebSearchResult(TwoEvents, 10, 20, 1));
        var runner = CreateRunner(app, client);

        var runs = await runner.RunAsync(new[] { IngestionType.Events }, dryRun: true, default);

        client.Calls.Should().Be(1);
        runs[0].Status.Should().Be(IngestionStatus.Succeeded);
        runs[0].ItemsConsidered.Should().Be(2);
        runs[0].ItemsUpserted.Should().Be(0);
        (await app.Db.LocalEvents.CountAsync()).Should().Be(0);
        (await app.Db.IngestionRuns.CountAsync()).Should().Be(0); // no audit row either
    }

    [Fact]
    public async Task Api_failure_is_recorded_as_failed_with_no_partial_writes()
    {
        await using var app = TestApp.Create();
        var client = new FakeWebSearchClient(new InvalidOperationException("upstream boom"));
        var runner = CreateRunner(app, client);

        var runs = await runner.RunAsync(new[] { IngestionType.Events }, dryRun: false, default);

        runs[0].Status.Should().Be(IngestionStatus.Failed);
        runs[0].ErrorMessage.Should().Contain("upstream boom");
        runs[0].FinishedUtc.Should().NotBeNull();
        (await app.Db.LocalEvents.CountAsync()).Should().Be(0);
        (await app.Db.IngestionRuns.SingleAsync()).Status.Should().Be(IngestionStatus.Failed);
    }

    [Fact]
    public async Task Mixed_valid_and_invalid_rows_yield_partial_success()
    {
        await using var app = TestApp.Create();
        const string oneGoodOneBad = """
            [
              {"name":"Good","startsOn":"2026-05-30","endsOn":"2026-05-30","location":"Here","url":"https://example.com/source"},
              {"name":"Bad — no date","location":"Here","url":"https://example.com/source"}
            ]
            """;
        var client = new FakeWebSearchClient(new WebSearchResult(oneGoodOneBad, 10, 20, 1));
        var runner = CreateRunner(app, client);

        var run = (await runner.RunAsync(new[] { IngestionType.Events }, dryRun: false, default)).Single();

        run.Status.Should().Be(IngestionStatus.PartialSuccess);
        run.ItemsConsidered.Should().Be(2);
        run.ItemsUpserted.Should().Be(1);
        run.ItemsRejected.Should().Be(1);
        (await app.Db.LocalEvents.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Daily_budget_short_circuits_before_calling_the_model()
    {
        await using var app = TestApp.Create();
        app.Db.IngestionRuns.Add(new IngestionRun
        {
            Id = Guid.NewGuid(),
            Type = IngestionType.Events,
            Status = IngestionStatus.Succeeded,
            StartedUtc = Clock.UtcNow
        });
        await app.Db.SaveChangesAsync();

        var client = new FakeWebSearchClient(new WebSearchResult("[]", 0, 0, 0));
        var runner = CreateRunner(app, client, maxRunsPerDay: 1);

        var run = (await runner.RunAsync(new[] { IngestionType.Events }, dryRun: false, default)).Single();

        run.Status.Should().Be(IngestionStatus.Failed);
        run.ErrorMessage.Should().Contain("budget");
        client.Calls.Should().Be(0);
        (await app.Db.IngestionRuns.CountAsync()).Should().Be(2); // the pre-existing run + the skipped one
    }

    [Fact]
    public async Task Each_type_runs_independently_in_one_pass()
    {
        await using var app = TestApp.Create();
        var activities = """[ {"name":"Bronte Creek","category":"Park","indoor":false,"sourceUrl":"https://example.com/source"} ]""";
        var client = new FakeWebSearchClient(new[]
        {
            new WebSearchResult(TwoEvents, 100, 50, 2),
            new WebSearchResult(activities, 80, 40, 1)
        });
        var runner = CreateRunner(app, client);

        var runs = await runner.RunAsync(
            new[] { IngestionType.Events, IngestionType.Activities }, dryRun: false, default);

        runs.Should().HaveCount(2);
        runs.Should().OnlyContain(r => r.Status == IngestionStatus.Succeeded);
        (await app.Db.LocalEvents.CountAsync()).Should().Be(2);
        (await app.Db.Activities.CountAsync()).Should().Be(1);
        (await app.Db.IngestionRuns.CountAsync()).Should().Be(2);
    }

    [Fact]
    public async Task A_failed_save_keeps_no_catalog_changes_records_the_run_failed_and_moves_on()
    {
        // Traces to: L2-080 AC4
        await using var app = TestApp.Create();
        var activities = """[ {"name":"Bronte Creek","category":"Park","indoor":false,"sourceUrl":"https://example.com/source"} ]""";
        var client = new FakeWebSearchClient(new[]
        {
            new WebSearchResult(TwoEvents, 100, 50, 2),
            new WebSearchResult(activities, 80, 40, 1)
        });
        var runner = CreateRunner(app, client);
        app.Db.FailOnSave = 2; // save 1 opens the Events row; save 2 commits its catalog and close

        var runs = await runner.RunAsync(
            new[] { IngestionType.Events, IngestionType.Activities }, dryRun: false, default);

        runs[0].Status.Should().Be(IngestionStatus.Failed);
        runs[0].ErrorMessage.Should().Contain("Simulated save failure.");
        runs[1].Status.Should().Be(IngestionStatus.Succeeded);
        (await app.Db.LocalEvents.CountAsync()).Should().Be(0);
        (await app.Db.Activities.CountAsync()).Should().Be(1);
        var persisted = await app.Db.IngestionRuns.AsNoTracking().ToListAsync();
        persisted.Should().HaveCount(2);
        persisted.Single(r => r.Type == IngestionType.Events).Status.Should().Be(IngestionStatus.Failed);
    }

    [Fact]
    public async Task A_cancelled_run_is_closed_as_failed_rather_than_left_running()
    {
        // Traces to: L2-080 AC5
        await using var app = TestApp.Create();
        using var cts = new CancellationTokenSource();
        var runner = CreateRunner(app, new CancelsMidCall(cts));

        var act = () => runner.RunAsync(new[] { IngestionType.Events }, dryRun: false, cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
        var run = await app.Db.IngestionRuns.AsNoTracking().SingleAsync();
        run.Status.Should().Be(IngestionStatus.Failed);
        run.ErrorMessage.Should().Be("Cancelled.");
        run.FinishedUtc.Should().NotBeNull();
    }

    [Theory]
    [InlineData("I could not find anything this weekend.")]
    [InlineData("[]")]
    public async Task Output_with_no_usable_items_is_recorded_as_failed(string output)
    {
        // Traces to: L2-080 AC6
        await using var app = TestApp.Create();
        var runner = CreateRunner(app, new FakeWebSearchClient(new WebSearchResult(output, 10, 5, 1)));

        var run = (await runner.RunAsync(new[] { IngestionType.Events }, dryRun: false, default)).Single();

        run.Status.Should().Be(IngestionStatus.Failed);
        run.ErrorMessage.Should().Be("The provider returned no usable items.");
    }

    [Fact]
    public void A_pass_with_a_failed_type_exits_with_one()
    {
        // Traces to: L2-083 AC3
        IngestionRunner.ExitCodeFor(new[]
        {
            new IngestionRun { Status = IngestionStatus.Succeeded },
            new IngestionRun { Status = IngestionStatus.Failed },
        }).Should().Be(1);
        IngestionRunner.ExitCodeFor(new[] { new IngestionRun { Status = IngestionStatus.PartialSuccess } })
            .Should().Be(0);
    }
}

/// <summary>Cancels the pass while the provider call is in flight, as a host shutdown would.</summary>
file sealed class CancelsMidCall(CancellationTokenSource cts) : IWebSearchClient
{
    public Task<WebSearchResult> SearchAsync(string systemPrompt, string userPrompt, CancellationToken cancellationToken = default)
    {
        cts.Cancel();
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(new WebSearchResult("[]", 0, 0, 0));
    }
}
