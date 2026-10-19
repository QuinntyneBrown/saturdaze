// Acceptance Test
// Traces to: L2-027 AC3
// Description: Activities from a weekend rated 2 stars or lower are not planned again.

using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Weekends;

public class LowRatedActivityTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public LowRatedActivityTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = (_, _, from, to) =>
        {
            var days = new List<WeatherForecast>();
            for (var d = from; d <= to; d = d.AddDays(1))
                days.Add(new WeatherForecast(d, new[] { "sunny", "warm" }, 24, 16, 0.0, false));
            return days;
        };
    }

    [Fact]
    public async Task A_later_weekend_and_its_regenerations_skip_the_activities_of_a_badly_rated_one()
    {
        var client = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        var badly = await Plan(client, "2026-04-11");
        var skipped = ActivityIds(badly);
        skipped.Should().NotBeEmpty();
        (await client.PutAsJsonAsync($"/api/weekends/{badly.GetProperty("id").GetGuid()}/rating", new { Rating = 2 }))
            .EnsureSuccessStatusCode();

        var later = await Plan(client, "2026-04-18");
        ActivityIds(later).Should().NotIntersectWith(skipped);

        var laterId = later.GetProperty("id").GetGuid();
        for (var i = 0; i < 3; i++)
        {
            var regenerated = await client.PostAsync($"/api/weekends/{laterId}/regenerate", null);
            regenerated.EnsureSuccessStatusCode();
            var body = JsonDocument.Parse(await regenerated.Content.ReadAsStringAsync()).RootElement;
            ActivityIds(body).Should().NotIntersectWith(skipped);
        }
    }

    private static async Task<JsonElement> Plan(HttpClient client, string weekendOf)
    {
        var res = await client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = weekendOf });
        res.EnsureSuccessStatusCode();
        return JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement.Clone();
    }

    private static HashSet<Guid> ActivityIds(JsonElement weekend) =>
        weekend.GetProperty("blocks").EnumerateArray()
            .Where(b => b.GetProperty("kind").GetString() == "Activity"
                && b.GetProperty("refId").ValueKind == JsonValueKind.String)
            .Select(b => b.GetProperty("refId").GetGuid())
            .ToHashSet();
}
