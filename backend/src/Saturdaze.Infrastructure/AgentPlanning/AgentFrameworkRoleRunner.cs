using System.Text.Json;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Application.AgentPlanning;

namespace Saturdaze.Infrastructure.AgentPlanning;

/// <summary>
/// <see cref="IAgentRoleRunner"/> on Microsoft Agent Framework (ADR-023). Each role runs as a
/// <see cref="ChatClientAgent"/> named after it, instrumented with OpenTelemetry on the
/// <c>Saturdaze.Agents</c> source without sensitive data, over the keyed <c>agent-planning</c>
/// <see cref="IChatClient"/> (the Anthropic SDK on Foundry; a scripted fake in tests). The run's
/// meter counts every model call and caps the function-calling loop.
/// </summary>
public sealed class AgentFrameworkRoleRunner : IAgentRoleRunner
{
    public const string ChatClientKey = "agent-planning";

    private readonly IChatClient _chat;

    public AgentFrameworkRoleRunner([FromKeyedServices(ChatClientKey)] IChatClient chat) => _chat = chat;

    public async Task<AgentRoleResult> RunAsync(AgentRoleRequest request, CancellationToken cancellationToken)
    {
        var meter = request.Meter;
        if (!meter.CanCallModel) return new AgentRoleResult(string.Empty);

        var client = new MeteredChatClient(_chat, meter)
            .AsBuilder()
            .UseFunctionInvocation(configure: f =>
            {
                f.MaximumIterationsPerRequest = Math.Max(1, meter.RemainingModelCalls);
                f.IncludeDetailedErrors = false;
            })
            .UseOpenTelemetry(sourceName: AgentTelemetry.SourceName, configure: o => o.EnableSensitiveData = false)
            .Build();

        var role = request.Role.ToString().ToLowerInvariant();
        var agent = new ChatClientAgent(client, new ChatClientAgentOptions
        {
            Name = role,
            Description = $"Saturdaze {role}",
            UseProvidedChatClientAsIs = true,
            ChatOptions = new ChatOptions
            {
                ModelId = request.Model,
                Instructions = request.Instructions,
                Tools = request.Tools.Select(t => (AITool)new AgentToolFunction(t)).ToList(),
            },
        })
            .AsBuilder()
            .UseOpenTelemetry(AgentTelemetry.SourceName, a => a.EnableSensitiveData = false)
            .Build();

        try
        {
            var response = await agent.RunAsync(request.Input, session: null, options: null, cancellationToken);
            return new AgentRoleResult(response.Text);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            throw new AgentRoleException($"The {role} could not answer: {ex.GetType().Name}", ex);
        }
    }

    /// <summary>An <see cref="AgentTool"/> as Agent Framework calls it: its own name, description and schema.</summary>
    private sealed class AgentToolFunction : AIFunction
    {
        private readonly AgentTool _tool;

        public AgentToolFunction(AgentTool tool) => _tool = tool;

        public override string Name => _tool.Name;
        public override string Description => _tool.Description;
        public override JsonElement JsonSchema => _tool.Schema;

        protected override async ValueTask<object?> InvokeCoreAsync(AIFunctionArguments arguments, CancellationToken cancellationToken)
        {
            var args = JsonSerializer.SerializeToElement(arguments.ToDictionary(a => a.Key, a => a.Value));
            return await _tool.InvokeAsync(args, cancellationToken);
        }
    }

    /// <summary>Counts each model call and its tokens into the run's meter (L2-207).</summary>
    private sealed class MeteredChatClient : DelegatingChatClient
    {
        private readonly AgentRunMeter _meter;

        public MeteredChatClient(IChatClient inner, AgentRunMeter meter) : base(inner) => _meter = meter;

        public override async Task<ChatResponse> GetResponseAsync(
            IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default)
        {
            if (!_meter.CanCallModel)
                return new ChatResponse(new ChatMessage(ChatRole.Assistant, string.Empty));
            var response = await base.GetResponseAsync(messages, options, cancellationToken);
            _meter.RecordModelCall((int)(response.Usage?.InputTokenCount ?? 0), (int)(response.Usage?.OutputTokenCount ?? 0));
            return response;
        }
    }
}
