using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Ingestion;
using Saturdaze.Application.Weather;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Infrastructure.Ingestion;

/// <summary>
/// Registers the whole ingestion pipeline (Application orchestration + the
/// Anthropic-backed web-search client) in one call. Self-contained so it can be
/// added by any host — the CLI, the Worker, or the API — without assuming the
/// other composition roots ran first. Reuses <c>TryAdd*</c> for the shared
/// services (<see cref="IDateTimeProvider"/>, <see cref="IAppDbContext"/>) so it
/// never double-registers when the host already provides them.
/// </summary>
public static class IngestionServiceCollectionExtensions
{
    public static IServiceCollection AddIngestion(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<IngestionOptions>()
            .Bind(configuration.GetSection(IngestionOptions.SectionName));

        // The prompt needs the family's home location; bind the same section the API uses.
        services.Configure<HomeLocationOptions>(configuration.GetSection(HomeLocationOptions.SectionName));

        services.AddOptions<ClaudeWebSearchOptions>()
            .Bind(configuration.GetSection(ClaudeWebSearchOptions.SectionName))
            .PostConfigure(o =>
            {
                // Secret comes from the environment in production (never the repo).
                var key = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
                if (!string.IsNullOrWhiteSpace(key))
                    o.ApiKey = key;
            });

        services.TryAddSingleton<IDateTimeProvider, SystemDateTimeProvider>();
        services.TryAddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        services.AddScoped<IngestionResultParser>();
        services.AddScoped<CatalogUpserter>();
        services.AddScoped<IngestionRunner>();

        var baseUrl = configuration[$"{ClaudeWebSearchOptions.SectionName}:BaseUrl"]
            ?? "https://api.anthropic.com/";

        services
            .AddHttpClient<IWebSearchClient, ClaudeWebSearchClient>(ClaudeWebSearchClient.HttpClientName, http =>
            {
                http.BaseAddress = new Uri(baseUrl, UriKind.Absolute);
                // The model runs several web searches inside one call, so this is
                // far longer than the weather client's 10s budget.
                http.Timeout = TimeSpan.FromMinutes(5);
            });

        return services;
    }
}
