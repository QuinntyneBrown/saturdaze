// Acceptance Test
// Traces to: L2-205 AC1
// Description: With agent planning off, a draft falls back at once and the family is told.

using System.Net;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.AgentPlanning;

/// <summary>The API with <c>Saturdaze:AgentPlanning:Enabled=false</c>.</summary>
public sealed class AgentPlanningOffFactory : SaturdazeApiFactory
{
    protected override IDictionary<string, string?> OverrideSettings =>
        new Dictionary<string, string?> { ["Saturdaze:AgentPlanning:Enabled"] = "false" };
}

public class AgentPlanningDisabledTests : IClassFixture<AgentPlanningOffFactory>
{
    private readonly AgentPlanningOffFactory _factory;

    public AgentPlanningDisabledTests(AgentPlanningOffFactory factory)
    {
        _factory = factory;
        _factory.Clock.Today = new DateOnly(2026, 10, 25);
        _factory.Agent.Reset();
    }

    [Fact]
    public async Task A_draft_with_agent_planning_off_falls_back_with_the_disabled_notice()
    {
        // Traces to: L2-205 AC1
        var persona = await Persona.CreateAsync(_factory);
        var weekend = await Plans.PlanAsync(persona.Session.Client, "2026-10-31");

        (await AgentDrafts.RequestAsync(persona.Session.Client, Plans.Id(weekend))).StatusCode.Should().Be(HttpStatusCode.Accepted);
        var run = await AgentDrafts.WaitAsync(persona.Session.Client, Plans.Id(weekend));
        var after = await Plans.ReadAsync(await persona.Session.Client.GetAsync($"/api/weekends/{Plans.Id(weekend)}"));

        run.GetProperty("status").GetString().Should().Be("FellBack");
        run.GetProperty("fallbackReason").GetString().Should().Be("Disabled");
        Plans.Blocks(after).Select(Plans.Shape).Should().Equal(Plans.Blocks(weekend).Select(Plans.Shape));
        after.GetProperty("agentDraft").GetProperty("notice").GetString()
            .Should().Be("Agent planning is off right now, so the planner made this weekend.");
        _factory.Agent.Calls.Should().Be(0, "the model is never called when agent planning is off");
    }
}
