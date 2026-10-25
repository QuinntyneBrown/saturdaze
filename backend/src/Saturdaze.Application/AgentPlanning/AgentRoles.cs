using System.Diagnostics;
using System.Text.Json;

namespace Saturdaze.Application.AgentPlanning;

/// <summary>The model roles of a draft (L2-202).</summary>
public enum AgentRole
{
    Researcher,
    Curator,
    Drafter
}

/// <summary>
/// A function tool a role may call: its name, description and JSON schema, and what it does.
/// Tools are bound to one family and weekend when they are made, so none takes a family id (L2-209).
/// </summary>
public sealed record AgentTool(
    string Name,
    string Description,
    JsonElement Schema,
    Func<JsonElement, CancellationToken, Task<string>> InvokeAsync);

/// <summary>One role's turn: who it is, which model, its instructions and input, and its tools.</summary>
public sealed record AgentRoleRequest(
    AgentRole Role,
    string Model,
    string Instructions,
    string Input,
    IReadOnlyList<AgentTool> Tools,
    AgentRunMeter Meter);

public sealed record AgentRoleResult(string Text);

/// <summary>
/// The Application port to a model role (ADR-023). Infrastructure implements it with Microsoft
/// Agent Framework over the Anthropic SDK's <c>IChatClient</c>; tests replace the chat client,
/// never this contract, so the real loop runs in tests.
/// </summary>
public interface IAgentRoleRunner
{
    /// <summary>Runs the role to its final answer; throws <see cref="AgentRoleException"/> when the model fails.</summary>
    Task<AgentRoleResult> RunAsync(AgentRoleRequest request, CancellationToken cancellationToken);
}

/// <summary>A model role could not answer (an outage, a refusal, an unconfigured endpoint).</summary>
public sealed class AgentRoleException : Exception
{
    public AgentRoleException(string message, Exception? inner = null) : base(message, inner) { }
}

/// <summary>The <c>Saturdaze.Agents</c> activity source every run's spans come from (L2-208).</summary>
public static class AgentTelemetry
{
    public const string SourceName = "Saturdaze.Agents";

    public static readonly ActivitySource Source = new(SourceName);
}

/// <summary>
/// Counts one run's model calls, tool calls, web searches and tokens, enforces the per-run
/// caps (L2-207) and collects the policy violations (L2-209). Thread-safe.
/// </summary>
public sealed class AgentRunMeter
{
    private readonly AgentPlanningOptions _options;
    private readonly List<string> _violations = new();
    private int _modelCalls, _toolCalls, _webSearches, _inputTokens, _outputTokens;

    public AgentRunMeter(AgentPlanningOptions options) => _options = options;

    public int ModelCalls => _modelCalls;
    public int ToolCalls => _toolCalls;
    public int WebSearches => _webSearches;
    public int InputTokens => _inputTokens;
    public int OutputTokens => _outputTokens;

    /// <summary>Model calls this run may still make.</summary>
    public int RemainingModelCalls =>
        _inputTokens + _outputTokens >= _options.MaxTokensPerRun ? 0 : Math.Max(0, _options.MaxModelCallsPerRun - _modelCalls);

    public bool CanCallModel => RemainingModelCalls > 0;

    public bool CanSearch => _webSearches < _options.MaxWebSearchesPerRun && CanCallModel;

    public int RemainingSearches => Math.Max(0, _options.MaxWebSearchesPerRun - _webSearches);

    public void RecordModelCall(int inputTokens, int outputTokens)
    {
        Interlocked.Increment(ref _modelCalls);
        Interlocked.Add(ref _inputTokens, inputTokens);
        Interlocked.Add(ref _outputTokens, outputTokens);
    }

    public void RecordSearch(int searches, int inputTokens, int outputTokens)
    {
        RecordModelCall(inputTokens, outputTokens);
        Interlocked.Add(ref _webSearches, searches);
    }

    /// <summary>Counts a tool call; false once the run's tool cap is reached.</summary>
    public bool TryUseTool() => Interlocked.Increment(ref _toolCalls) <= _options.MaxToolCallsPerRun;

    public void Violation(string checkpoint, string detail)
    {
        lock (_violations) _violations.Add($"{checkpoint}: {detail}");
    }

    public IReadOnlyList<string> Violations
    {
        get { lock (_violations) return _violations.ToList(); }
    }
}
