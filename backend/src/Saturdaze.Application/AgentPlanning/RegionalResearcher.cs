using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Common;
using Saturdaze.Application.Ingestion;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Domain.ValueObjects;

namespace Saturdaze.Application.AgentPlanning;

/// <summary>
/// The regional researcher (L2-202, L2-207): what is on this weekend around a region cell, found
/// with Claude's web search and upserted into the shared catalog through ingestion's own parser and
/// upserter. Done once per cell and weekend and reused by every family in the cell; its prompt
/// carries the cell centre and the weekend only, never a family's data.
/// </summary>
public sealed class RegionalResearcher
{
    private readonly IWebSearchClient _search;
    private readonly IngestionResultParser _parser;
    private readonly CatalogUpserter _upserter;
    private readonly IAppDbContext _db;
    private readonly IDateTimeProvider _clock;
    private readonly AgentControlGate _gate;
    private readonly AgentPlanningOptions _options;
    private readonly ILogger<RegionalResearcher> _logger;

    public RegionalResearcher(
        IWebSearchClient search, IngestionResultParser parser, CatalogUpserter upserter, IAppDbContext db,
        IDateTimeProvider clock, AgentControlGate gate, IOptions<AgentPlanningOptions> options, ILogger<RegionalResearcher> logger)
    {
        _search = search;
        _parser = parser;
        _upserter = upserter;
        _db = db;
        _clock = clock;
        _gate = gate;
        _options = options.Value;
        _logger = logger;
    }

    /// <summary>The cell a home falls in: coordinates rounded to 0.5°.</summary>
    public static (decimal Lat, decimal Lng, string Key) Cell(GeoLocation home)
    {
        var lat = Math.Round(home.Latitude * 2, MidpointRounding.AwayFromZero) / 2;
        var lng = Math.Round(home.Longitude * 2, MidpointRounding.AwayFromZero) / 2;
        return (lat, lng, string.Create(CultureInfo.InvariantCulture, $"{lat:0.0},{lng:0.0}"));
    }

    public async Task EnsureAsync(GeoLocation home, DateOnly weekendOf, Guid runId, AgentRunMeter meter, CancellationToken ct)
    {
        var (lat, lng, key) = Cell(home);
        var freshSince = _clock.UtcNow.AddDays(-_options.ResearchReuseDays);
        if (await _db.RegionResearch.AnyAsync(r => r.CellKey == key && r.WeekendOf == weekendOf && r.CompletedUtc >= freshSince, ct))
            return;
        if (!meter.CanSearch) return;

        using var agent = AgentTelemetry.Source.StartActivity("invoke_agent researcher");
        agent?.SetTag("gen_ai.operation.name", "invoke_agent");
        agent?.SetTag("gen_ai.agent.name", "researcher");

        var context = new IngestionContext(
            string.Create(CultureInfo.InvariantCulture, $"the area centred on latitude {lat:0.0}, longitude {lng:0.0}"),
            _options.ResearchRadiusMinutes, weekendOf);
        var system = IngestionPrompts.BuildSystemPrompt(IngestionType.Events, context);
        var user = IngestionPrompts.BuildUserPrompt(IngestionType.Events, context);

        WebSearchResult result;
        using (var chat = AgentTelemetry.Source.StartActivity($"chat {_options.ResearcherModel}"))
        {
            chat?.SetTag("gen_ai.operation.name", "chat");
            chat?.SetTag("gen_ai.provider.name", "anthropic");
            chat?.SetTag("gen_ai.request.model", _options.ResearcherModel);
            result = await _search.SearchAsync(system, user, ct);
            chat?.SetTag("gen_ai.usage.input_tokens", result.InputTokens);
            chat?.SetTag("gen_ai.usage.output_tokens", result.OutputTokens);
        }
        meter.RecordSearch(result.WebSearchCount, result.InputTokens, result.OutputTokens);

        var parsed = _parser.Parse(result.RawText, IngestionType.Events);
        var kept = _gate.CheckResearchRows(parsed.Items, result.SearchResultUrls, meter);
        var upsert = await _upserter.UpsertAsync(kept, IngestionType.Events, ct, commit: false);
        _db.RegionResearch.Add(new RegionResearch
        {
            Id = Guid.NewGuid(), CellKey = key, WeekendOf = weekendOf, AgentRunId = runId,
            CompletedUtc = _clock.UtcNow, ItemsUpserted = upsert.Upserted,
        });
        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Regional research for cell {Cell}, weekend {Weekend}: {Kept} of {Considered} rows kept.",
            key, weekendOf, kept.Count, parsed.Considered);
    }
}
