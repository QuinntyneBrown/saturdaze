// Acceptance Test
// Traces to: L2-184, L2-185, L2-186, L2-187, L2-188, L2-189
// Description: Planner defects found by docs/schedule-generation-evaluation.md, proven through the API.

using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.Planning;

public class PlanQualityTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public PlanQualityTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = FakeWeatherClient.Sunny;
    }

    [Fact]
    public async Task The_regenerate_response_lists_each_block_once_as_stored()
    {
        // Traces to: L2-188 AC1
        var session = await SignedInClient.CreateAsync(_factory);
        var weekend = await Plans.PlanAsync(session.Client, "2026-06-06");

        var regenerated = await Plans.ReadAsync(
            await session.Client.PostAsync($"/api/weekends/{Plans.Id(weekend)}/regenerate", content: null));
        var stored = await Plans.ReadAsync(await session.Client.GetAsync($"/api/weekends/{Plans.Id(weekend)}"));

        var ids = Plans.Blocks(regenerated).Select(b => b.GetProperty("id").GetGuid()).ToList();
        ids.Should().OnlyHaveUniqueItems();
        Plans.Blocks(regenerated).Select(Plans.Shape).Should().BeEquivalentTo(Plans.Blocks(stored).Select(Plans.Shape));
    }

    [Fact]
    public async Task The_regenerate_day_response_lists_each_block_once_as_stored()
    {
        // Traces to: L2-188 AC2
        var session = await SignedInClient.CreateAsync(_factory);
        var weekend = await Plans.PlanAsync(session.Client, "2026-06-13");

        var regenerated = await Plans.ReadAsync(
            await session.Client.PostAsync($"/api/weekends/{Plans.Id(weekend)}/days/Sunday/regenerate", content: null));
        var stored = await Plans.ReadAsync(await session.Client.GetAsync($"/api/weekends/{Plans.Id(weekend)}"));

        Plans.Blocks(regenerated).Select(b => b.GetProperty("id").GetGuid()).Should().OnlyHaveUniqueItems();
        Plans.Blocks(regenerated).Select(Plans.Shape).Should().BeEquivalentTo(Plans.Blocks(stored).Select(Plans.Shape));
    }
}
