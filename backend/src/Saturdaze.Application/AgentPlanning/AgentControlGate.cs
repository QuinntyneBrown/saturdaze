using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Abstractions;
using Saturdaze.Application.Ingestion;

namespace Saturdaze.Application.AgentPlanning;

/// <summary>
/// The runtime controls of agent planning (L2-209), at three of the Agent Control Specification's
/// intervention points, fail-closed with allow / deny verdicts (ADR-023). The policies are also
/// written as an ACS manifest under <c>evals/assert/acs/</c>; this class mirrors them rule for rule.
/// With <see cref="AgentControlsOptions.Enabled"/> off, input and output checks allow and record
/// (the ASSERT "before" baseline); the validator still decides what reaches a weekend.
/// </summary>
public sealed partial class AgentControlGate
{
    /// <summary>The tools each role may call (ACS <c>pre_tool_call</c>, <c>tool_allow_list.rego</c>).</summary>
    public static readonly IReadOnlyDictionary<AgentRole, IReadOnlySet<string>> AllowedTools = new Dictionary<AgentRole, IReadOnlySet<string>>
    {
        [AgentRole.Researcher] = new HashSet<string>(),
        [AgentRole.Curator] = new HashSet<string> { PlanningToolset.SearchCatalog, PlanningToolset.GetPlace, PlanningToolset.GetWeather, PlanningToolset.GetDaylight, PlanningToolset.GetDriveMinutes },
        [AgentRole.Drafter] = new HashSet<string> { PlanningToolset.GetPlace, PlanningToolset.GetDaylight },
    };

    private readonly IAppDbContext _db;
    private readonly AgentControlsOptions _options;

    public AgentControlGate(IAppDbContext db, Microsoft.Extensions.Options.IOptions<AgentPlanningOptions> options)
    {
        _db = db;
        _options = options.Value.Controls;
    }

    public bool Enforcing => _options.Enabled;

    /// <summary>
    /// ACS <c>input</c> (<c>no_cross_family_data.rego</c>): no forbidden term of this family (names,
    /// emails, address, coordinates, its id) and no id of any family, member or account. False = deny.
    /// </summary>
    public async Task<bool> CheckInputAsync(AgentRole role, string prompt, IReadOnlyList<string> forbidden, AgentRunMeter meter, CancellationToken ct)
    {
        var hits = forbidden.Where(term => ContainsWord(prompt, term)).ToList();
        var guids = GuidPattern().Matches(prompt).Select(m => Guid.Parse(m.Value)).Distinct().ToList();
        if (guids.Count > 0)
        {
            var people = await _db.Families.Where(f => guids.Contains(f.Id)).Select(f => f.Id)
                .Concat(_db.FamilyMembers.Where(m => guids.Contains(m.Id)).Select(m => m.Id))
                .Concat(_db.Users.Where(u => guids.Contains(u.Id)).Select(u => u.Id))
                .ToListAsync(ct);
            hits.AddRange(people.Select(_ => "a family, member or account id"));
        }
        if (hits.Count == 0) return true;
        meter.Violation("input", $"{role} prompt carried {hits.Count} protected value(s)");
        return !Enforcing;
    }

    /// <summary>
    /// ACS <c>pre_tool_call</c>: the role's allow-list, the tool's schema and the run's tool cap.
    /// Returns null to allow, or the refusal the model is told.
    /// </summary>
    public string? CheckToolCall(AgentRole role, AgentTool tool, JsonElement arguments, AgentRunMeter meter)
    {
        string? refusal = null;
        if (!AllowedTools[role].Contains(tool.Name)) refusal = $"{tool.Name} is not allowed for the {role.ToString().ToLowerInvariant()}";
        else if (!meter.TryUseTool()) refusal = "the run's tool-call limit is reached";
        else if (SchemaProblem(tool.Schema, arguments) is { } problem) refusal = $"{tool.Name} arguments: {problem}";
        if (refusal is null) return null;
        meter.Violation("tool", refusal);
        return refusal;
    }

    /// <summary>ACS <c>output</c>: an id the catalog does not hold is never kept.</summary>
    public void RecordOutputViolation(AgentRole role, string detail, AgentRunMeter meter) =>
        meter.Violation("output", $"{role.ToString().ToLowerInvariant()}: {detail}");

    /// <summary>
    /// ACS <c>output</c> (<c>verified_sources.rego</c>) for research: a row is kept only when its URL is
    /// https and among the run's web-search results (L2-209 AC5).
    /// </summary>
    public IReadOnlyList<IngestionItem> CheckResearchRows(
        IReadOnlyList<IngestionItem> rows, IReadOnlyList<string> searchResultUrls, AgentRunMeter meter)
    {
        var seen = searchResultUrls.Select(Normalize).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var kept = new List<IngestionItem>();
        foreach (var row in rows)
        {
            var url = row.Payload.TryGetPropertyValue("url", out var u) ? u?.ToString() : null;
            if (url is not null && seen.Contains(Normalize(url))) kept.Add(row);
            else meter.Violation("output", $"research row '{row.DisplayName}' cites a URL the search did not return");
        }
        return Enforcing ? kept : rows;
    }

    private static string Normalize(string url) => url.Trim().TrimEnd('/');

    private static bool ContainsWord(string text, string term) =>
        Regex.IsMatch(text, $@"(?<![\p{{L}}\p{{N}}]){Regex.Escape(term)}(?![\p{{L}}\p{{N}}])",
            term.Any(char.IsDigit) || term.Contains('@') ? RegexOptions.IgnoreCase : RegexOptions.None);

    /// <summary>Required properties present, types right, enum values known; enough for the tools' small schemas.</summary>
    private static string? SchemaProblem(JsonElement schema, JsonElement args)
    {
        if (args.ValueKind != JsonValueKind.Object) return "expected an object";
        var properties = schema.TryGetProperty("properties", out var p) ? p : default;
        if (schema.TryGetProperty("required", out var required))
            foreach (var name in required.EnumerateArray().Select(r => r.GetString()!))
                if (!args.TryGetProperty(name, out _)) return $"missing {name}";
        foreach (var arg in args.EnumerateObject())
        {
            if (properties.ValueKind != JsonValueKind.Object || !properties.TryGetProperty(arg.Name, out var spec)) return $"unknown {arg.Name}";
            var type = spec.TryGetProperty("type", out var t) ? t.GetString() : null;
            var ok = type switch
            {
                "string" => arg.Value.ValueKind == JsonValueKind.String,
                "integer" => arg.Value.ValueKind == JsonValueKind.Number && arg.Value.TryGetInt32(out _),
                "boolean" => arg.Value.ValueKind is JsonValueKind.True or JsonValueKind.False,
                _ => true
            };
            if (!ok) return $"{arg.Name} is not a {type}";
            if (spec.TryGetProperty("enum", out var values) && arg.Value.ValueKind == JsonValueKind.String
                && values.EnumerateArray().All(v => !string.Equals(v.GetString(), arg.Value.GetString(), StringComparison.OrdinalIgnoreCase)))
                return $"{arg.Name} is not one of the allowed values";
        }
        return null;
    }

    [GeneratedRegex(@"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b")]
    private static partial Regex GuidPattern();
}
