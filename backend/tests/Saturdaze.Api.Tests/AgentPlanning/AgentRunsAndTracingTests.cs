// Acceptance Test
// Traces to: L2-208 AC1, AC2, AC3, AC4
// Description: Every run is traced without personal data and listed, with its cost, to administrators.

using System.Collections.Concurrent;
using System.Diagnostics;
using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.AgentPlanning;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.AgentPlanning;

public class AgentRunsAndTracingTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime, IDisposable
{
    private readonly SaturdazeApiFactory _factory;
    private readonly ConcurrentBag<Activity> _spans = new();
    private readonly ActivityListener _listener;

    public AgentRunsAndTracingTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Clock.Today = new DateOnly(2026, 10, 25);
        _factory.Agent.Reset();
        _factory.WebSearch.Reset();
        _listener = new ActivityListener
        {
            ShouldListenTo = source => source.Name == AgentTelemetry.SourceName,
            Sample = (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllDataAndRecorded,
            ActivityStopped = activity => _spans.Add(activity),
        };
        ActivitySource.AddActivityListener(_listener);
    }

    public void Dispose() => _listener.Dispose();

    public async Task InitializeAsync()
    {
        using var scope = _factory.Services.CreateScope();
        await EvaluationCatalog.SeedAsync(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private Guid Id(string name) => Db(db => db.Activities.Single(a => a.Name == name).Id);

    private T Db<T>(Func<AppDbContext, T> read)
    {
        using var scope = _factory.Services.CreateScope();
        return read(scope.ServiceProvider.GetRequiredService<AppDbContext>());
    }

    /// <summary>The persona's Oct 31 weekend drafted by a curator that looks once and a drafter that picks once.</summary>
    private async Task<(Persona.Family Persona, JsonElement Run)> DraftAsync()
    {
        var persona = await Persona.CreateAsync(_factory);
        var kariya = Id("Kariya Park");
        _factory.Agent.ToolCall = turn => turn.Role == "curator" ? ("search_catalog", new { kind = "any" }) : null;
        _factory.Agent.Answer = turn => turn.Role == "curator"
            ? JsonSerializer.Serialize(new { shortlist = new[] { new { kind = "activity", id = kariya, reason = "A calm garden walk.", @checked = new[] { "no Halloween" } } } })
            : JsonSerializer.Serialize(new { picks = new[] { new { day = "Saturday", kind = "activity", id = kariya, start = "09:30", reason = "A calm garden walk." } } });
        var (run, _) = await AgentDrafts.DraftAsync(persona.Session.Client, "2026-10-31");
        return (persona, run);
    }

    [Fact]
    public async Task An_administrator_sees_the_run_with_its_usage_cost_and_trace()
    {
        // Traces to: L2-208 AC1
        var (_, run) = await DraftAsync();
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);

        var page = await Plans.ReadAsync(await admin.Client.GetAsync("/api/admin/agent-runs?take=50"));

        var listed = page.GetProperty("runs").EnumerateArray().Single(r => r.GetProperty("id").GetGuid() == run.GetProperty("runId").GetGuid());
        listed.GetProperty("status").GetString().Should().Be("Applied");
        listed.GetProperty("inputTokens").GetInt32().Should().BeGreaterThan(0);
        listed.GetProperty("costUsd").GetDecimal().Should().BeGreaterThan(0);
        listed.GetProperty("traceId").GetString().Should().MatchRegex("^[0-9a-f]{32}$");
        var totals = page.GetProperty("totals");
        totals.GetProperty("runsToday").GetInt32().Should().BeGreaterThanOrEqualTo(1);
        totals.GetProperty("appliedToday").GetInt32().Should().BeGreaterThanOrEqualTo(1);
        totals.GetProperty("spendThisMonthUsd").GetDecimal().Should().BeGreaterThan(0);
        totals.GetProperty("monthlyCapUsd").GetDecimal().Should().Be(25m);
        totals.GetProperty("runsPerDayCap").GetInt32().Should().Be(60);
    }

    [Fact]
    public async Task A_family_member_who_is_not_an_administrator_is_refused()
    {
        // Traces to: L2-208 AC2
        var member = await SignedInClient.CreateAsync(_factory);

        (await member.Client.GetAsync("/api/admin/agent-runs")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task A_run_is_one_trace_with_a_span_per_role_and_token_usage_on_each_model_call()
    {
        // Traces to: L2-208 AC3
        var (_, run) = await DraftAsync();
        var traceId = run.GetProperty("runId").GetGuid().ToString();
        await Task.Delay(200);

        var root = _spans.Single(s => s.OperationName == "plan_weekend" && (string?)s.GetTagItem("saturdaze.run.id") == traceId);
        var trace = _spans.Where(s => s.TraceId == root.TraceId).ToList();
        // The span name an exporter sends is the activity's display name.
        trace.Should().Contain(s => s.DisplayName.StartsWith("invoke_agent curator", StringComparison.Ordinal));
        trace.Should().Contain(s => s.DisplayName.StartsWith("invoke_agent drafter", StringComparison.Ordinal));
        var chats = trace.Where(s => s.DisplayName.StartsWith("chat ", StringComparison.Ordinal)).ToList();
        chats.Should().NotBeEmpty();
        chats.Should().OnlyContain(s => s.GetTagItem("gen_ai.usage.input_tokens") != null && s.GetTagItem("gen_ai.usage.output_tokens") != null);
        trace.Should().Contain(s => s.DisplayName.StartsWith("execute_tool", StringComparison.Ordinal));
        trace.Should().Contain(s => s.DisplayName == "validate_plan");
        root.GetTagItem("saturdaze.run.status").Should().Be("Applied");
    }

    [Fact]
    public async Task Neither_the_spans_nor_the_run_carry_names_or_the_address()
    {
        // Traces to: L2-208 AC4
        var (_, run) = await DraftAsync();
        await Task.Delay(200);
        var root = _spans.Single(s => s.OperationName == "plan_weekend" && (string?)s.GetTagItem("saturdaze.run.id") == run.GetProperty("runId").GetGuid().ToString());

        var tags = string.Join("\n", _spans.Where(s => s.TraceId == root.TraceId)
            .SelectMany(s => s.TagObjects.Select(t => $"{t.Key}={t.Value}").Append(s.DisplayName)));
        tags.Should().NotContain("Mia").And.NotContain("Ava").And.NotContain("Hurontario").And.NotContain("child, 6");
        var row = Db(db => db.AgentRuns.Single(r => r.Id == run.GetProperty("runId").GetGuid()));
        JsonSerializer.Serialize(row).Should().NotContain("Mia").And.NotContain("Hurontario");
    }
}
