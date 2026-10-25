using Anthropic.Foundry;
using Azure.Core;
using Azure.Identity;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Azure.Monitor.OpenTelemetry.Exporter;
using OpenTelemetry.Trace;
using Saturdaze.Application.AgentPlanning;
using Saturdaze.Infrastructure.Ingestion;

namespace Saturdaze.Infrastructure.AgentPlanning;

/// <summary>
/// Registers agent planning's infrastructure (ADR-023): its options, the Agent Framework role
/// runner, the Foundry-backed chat client and the OpenTelemetry tracer that exports the
/// <c>Saturdaze.Agents</c> spans to Application Insights. Any host — the API or the CLI — may call it;
/// an unconfigured endpoint fails a run lazily, never startup (L2-213 AC3).
/// </summary>
public static class AgentPlanningServiceCollectionExtensions
{
    /// <summary>The Entra scope Claude on Foundry accepts (Use Claude in Foundry, 2026-10).</summary>
    public const string FoundryScope = "https://ai.azure.com/.default";

    public static IServiceCollection AddAgentPlanning(this IServiceCollection services, IConfiguration configuration)
    {
        // The researcher reuses ingestion's parser, upserter and Claude web-search client.
        services.AddIngestion(configuration);
        services.AddOptions<AgentPlanningOptions>().Bind(configuration.GetSection(AgentPlanningOptions.SectionName));
        services.AddScoped<IAgentRoleRunner, AgentFrameworkRoleRunner>();
        services.AddKeyedSingleton<IChatClient>(AgentFrameworkRoleRunner.ChatClientKey, (sp, _) =>
            CreateChatClient(sp.GetRequiredService<IOptions<AgentPlanningOptions>>().Value, Environment.GetEnvironmentVariable, null));
        services.AddAgentTelemetry(configuration);
        return services;
    }

    /// <summary>
    /// The Anthropic SDK's <see cref="IChatClient"/> on Foundry: a managed-identity bearer token, or the
    /// account key from <c>ANTHROPIC_FOUNDRY_API_KEY</c> (L2-213 AC1, AC2).
    /// </summary>
    public static IChatClient CreateChatClient(AgentPlanningOptions options, Func<string, string?> environment, TokenCredential? credential)
    {
        if (string.IsNullOrWhiteSpace(options.FoundryResource))
            return new UnconfiguredChatClient($"{AgentPlanningOptions.SectionName}:FoundryResource is not set.");
        var credentials = Credentials(options, environment, credential);
        if (credentials is null)
            return new UnconfiguredChatClient($"{ClaudeWebSearchOptions.FoundryApiKeyVariable} is not set and Auth is Key.");
        return new AnthropicFoundryClient(credentials).AsIChatClient(options.CuratorModel, options.MaxOutputTokens);
    }

    public static IAnthropicFoundryCredentials? Credentials(AgentPlanningOptions options, Func<string, string?> environment, TokenCredential? credential)
    {
        if (options.Auth == AgentAuth.ManagedIdentity)
            return new AnthropicFoundryIdentityTokenCredentials(credential ?? new DefaultAzureCredential(), options.FoundryResource.Trim(), new[] { FoundryScope });
        var key = environment(ClaudeWebSearchOptions.FoundryApiKeyVariable);
        return string.IsNullOrWhiteSpace(key) ? null : new AnthropicFoundryApiKeyCredentials(key, options.FoundryResource.Trim());
    }

    /// <summary>
    /// Traces the <c>Saturdaze.Agents</c> source and, when <c>APPLICATIONINSIGHTS_CONNECTION_STRING</c>
    /// is set, exports it to Application Insights (L2-208).
    /// </summary>
    public static IServiceCollection AddAgentTelemetry(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration["APPLICATIONINSIGHTS_CONNECTION_STRING"];
        services.AddOpenTelemetry().WithTracing(tracing =>
        {
            tracing.AddSource(AgentTelemetry.SourceName);
            if (!string.IsNullOrWhiteSpace(connectionString))
                tracing.AddAzureMonitorTraceExporter(o => o.ConnectionString = connectionString);
        });
        return services;
    }

    /// <summary>A chat client that explains, on first use, why agent planning cannot reach the model.</summary>
    private sealed class UnconfiguredChatClient : IChatClient
    {
        private readonly string _why;

        public UnconfiguredChatClient(string why) => _why = why;

        public Task<ChatResponse> GetResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default)
            => throw new InvalidOperationException($"Agent planning is not configured: {_why}");

        public IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(IEnumerable<ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default)
            => throw new InvalidOperationException($"Agent planning is not configured: {_why}");

        public object? GetService(Type serviceType, object? serviceKey = null) => null;

        public void Dispose() { }
    }
}
