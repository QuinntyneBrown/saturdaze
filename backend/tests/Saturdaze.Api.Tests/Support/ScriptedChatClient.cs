using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.Extensions.AI;

namespace Saturdaze.Api.Tests.Support;

/// <summary>
/// Stands in for Claude behind the agents' <see cref="IChatClient"/> (ADR-023): never a network call.
/// Each role answers from a script — an optional tool call first, then its final JSON — so the real
/// Agent Framework loop, tools, controls and validator run in API tests (ADR-020 style).
/// </summary>
public sealed class ScriptedChatClient : IChatClient
{
    /// <summary>The role named on the first line of every agent prompt ("Role: curator").</summary>
    public sealed record Turn(string Role, string Prompt, int Round, IReadOnlyList<string> ToolResults, string? Model);

    /// <summary>A tool call the role makes before answering; null for none.</summary>
    public Func<Turn, (string Name, object Arguments)?> ToolCall { get; set; } = _ => null;

    /// <summary>The role's final answer text.</summary>
    public Func<Turn, string> Answer { get; set; } = turn => turn.Role == "curator" ? """{"shortlist":[]}""" : """{"picks":[]}""";

    /// <summary>Throws instead of answering (L2-205 AC2).</summary>
    public Exception? Fail { get; set; }

    /// <summary>How long each answer takes (L2-205 AC3).</summary>
    public TimeSpan Delay { get; set; } = TimeSpan.Zero;

    /// <summary>When set, the role keeps calling this tool and never answers (L2-207 AC4).</summary>
    public string? EndlessTool { get; set; }

    public int InputTokensPerCall { get; set; } = 1000;
    public int OutputTokensPerCall { get; set; } = 200;

    /// <summary>Every prompt the agents sent, in full (L2-209 AC1, AC4).</summary>
    public ConcurrentQueue<string> Prompts { get; } = new();

    public int Calls;

    public void Reset()
    {
        ToolCall = _ => null;
        Answer = turn => turn.Role == "curator" ? """{"shortlist":[]}""" : """{"picks":[]}""";
        Fail = null;
        Delay = TimeSpan.Zero;
        EndlessTool = null;
        while (Prompts.TryDequeue(out _)) { }
        Calls = 0;
    }

    public async Task<ChatResponse> GetResponseAsync(
        IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default)
    {
        Interlocked.Increment(ref Calls);
        var list = messages.ToList();
        var toolResults = list.SelectMany(m => m.Contents.OfType<FunctionResultContent>()).Select(r => r.Result?.ToString() ?? "");
        var prompt = string.Join("\n", new[] { options?.Instructions }.Concat(list.Select(m => m.Text)).Concat(toolResults)
            .Where(t => !string.IsNullOrEmpty(t)));
        Prompts.Enqueue(prompt);

        if (Delay > TimeSpan.Zero) await Task.Delay(Delay, cancellationToken);
        if (Fail is not null) throw Fail;

        var role = RoleOf(prompt);
        var results = list.SelectMany(m => m.Contents.OfType<FunctionResultContent>()).Select(r => r.Result?.ToString() ?? "").ToList();
        var round = RoundOf(prompt);
        var turn = new Turn(role, prompt, round, results, options?.ModelId);
        var usage = new UsageDetails { InputTokenCount = InputTokensPerCall, OutputTokenCount = OutputTokensPerCall, TotalTokenCount = InputTokensPerCall + OutputTokensPerCall };

        if (EndlessTool is not null || (results.Count == 0 && ToolCall(turn) is not null))
        {
            var (name, args) = EndlessTool is not null ? (EndlessTool, (object)new { kind = "any" }) : ToolCall(turn)!.Value;
            var json = JsonSerializer.SerializeToElement(args);
            var arguments = json.EnumerateObject().ToDictionary(p => p.Name, p => (object?)p.Value);
            var call = new FunctionCallContent($"call-{Guid.NewGuid():N}", name, arguments);
            return new ChatResponse(new ChatMessage(ChatRole.Assistant, new List<AIContent> { call })) { Usage = usage, ModelId = options?.ModelId };
        }

        return new ChatResponse(new ChatMessage(ChatRole.Assistant, Answer(turn))) { Usage = usage, ModelId = options?.ModelId };
    }

    public async IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(
        IEnumerable<ChatMessage> messages, ChatOptions? options = null,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var response = await GetResponseAsync(messages, options, cancellationToken);
        foreach (var update in response.ToChatResponseUpdates()) yield return update;
    }

    public object? GetService(Type serviceType, object? serviceKey = null) =>
        serviceType.IsInstanceOfType(this) ? this : null;

    public void Dispose() { }

    private static string RoleOf(string prompt)
    {
        var at = prompt.IndexOf("Role: ", StringComparison.Ordinal);
        if (at < 0) return "unknown";
        var end = prompt.IndexOfAny(new[] { '\n', '\r', '.' }, at);
        return prompt[(at + 6)..(end < 0 ? prompt.Length : end)].Trim().ToLowerInvariant();
    }

    private static int RoundOf(string prompt)
    {
        var at = prompt.IndexOf("Round ", StringComparison.Ordinal);
        return at >= 0 && int.TryParse(new string(prompt[(at + 6)..].TakeWhile(char.IsDigit).ToArray()), out var n) ? n : 1;
    }
}
