using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Weekends;

/// <summary>
/// L2-090 / L2-091: the weekend carries numbered stops, travel legs between consecutive
/// blocks at different places, and per-day stop and driving totals. The planner's picks
/// vary, so these tests assert the rules over whatever it planned.
/// </summary>
public class TravelLegTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private JsonElement _weekend;

    public TravelLegTests(SaturdazeApiFactory factory)
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

    public async Task InitializeAsync()
    {
        var client = (await SignedInClient.CreateAsync(_factory)).Client;
        var response = await client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = "2026-05-16" });
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        _weekend = JsonDocument.Parse(body).RootElement.Clone();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private IEnumerable<IGrouping<string, JsonElement>> Days() =>
        _weekend.GetProperty("blocks").EnumerateArray()
            .Where(b => b.GetProperty("kind").GetString() != "Drive")
            .GroupBy(b => b.GetProperty("day").GetString()!);

    private static JsonElement? Leg(JsonElement block) =>
        block.TryGetProperty("legBefore", out var leg) && leg.ValueKind == JsonValueKind.Object ? leg : null;

    private static int? StopNumber(JsonElement block) =>
        block.TryGetProperty("stopNumber", out var n) && n.ValueKind == JsonValueKind.Number ? n.GetInt32() : null;

    private static bool AtHome(JsonElement block) =>
        block.GetProperty("kind").GetString() is "Downtime"
        || block.GetProperty("kind").GetString() == "Meal" && block.GetProperty("refId").ValueKind == JsonValueKind.Null;

    [Fact]
    public void Stops_away_from_home_are_numbered_in_time_order_per_day()
    {
        // Traces to: L2-091 AC1
        var anyStops = false;
        foreach (var day in Days())
        {
            var numbers = day.Select(StopNumber).Where(n => n is not null).Select(n => n!.Value).ToList();
            numbers.Should().Equal(Enumerable.Range(1, numbers.Count), $"stops on {day.Key} count up from 1");
            anyStops |= numbers.Count > 0;
            foreach (var block in day.Where(AtHome)) StopNumber(block).Should().BeNull();
        }

        anyStops.Should().BeTrue("the planner placed at least one catalog activity");
    }

    [Fact]
    public void A_leg_precedes_each_stop_and_none_sits_between_two_home_blocks()
    {
        // Traces to: L2-090 AC1, AC2
        foreach (var day in Days())
        {
            var blocks = day.ToList();
            for (var i = 0; i < blocks.Count; i++)
            {
                var leg = Leg(blocks[i]);
                if (StopNumber(blocks[i]) is not null && i > 0 && StopNumber(blocks[i - 1]) is null)
                {
                    leg.Should().NotBeNull($"{blocks[i].GetProperty("title")} follows a block elsewhere");
                    leg!.Value.GetProperty("minutes").GetInt32().Should().BePositive();
                    leg.Value.GetProperty("distanceKm").GetDecimal().Should().BePositive();
                }

                if (i > 0 && AtHome(blocks[i]) && AtHome(blocks[i - 1])) leg.Should().BeNull();
            }
        }
    }

    [Fact]
    public void Only_legs_over_ten_minutes_link_to_directions_carrying_nothing_but_coordinates()
    {
        // Traces to: L2-090 AC3, AC6
        var legs = Days().SelectMany(d => d).Select(Leg).Where(l => l is not null).Select(l => l!.Value).ToList();
        legs.Should().NotBeEmpty();
        foreach (var leg in legs)
        {
            var url = leg.GetProperty("directionsUrl");
            if (leg.GetProperty("minutes").GetInt32() <= 10)
            {
                url.ValueKind.Should().Be(JsonValueKind.Null);
                continue;
            }

            var text = url.GetString()!;
            text.Should().StartWith("https://");
            Regex.IsMatch(text, "[0-9a-f]{8}-[0-9a-f]{4}-", RegexOptions.IgnoreCase).Should().BeFalse("no ids in the link");
            var query = new Uri(text).Query.TrimStart('?').Split('&').ToDictionary(p => p.Split('=')[0], p => Uri.UnescapeDataString(p.Split('=')[1]));
            query.Keys.Should().BeEquivalentTo("api", "origin", "destination", "travelmode");
            query["origin"].Should().MatchRegex(@"^-?\d+(\.\d+)?,-?\d+(\.\d+)?$");
            query["destination"].Should().MatchRegex(@"^-?\d+(\.\d+)?,-?\d+(\.\d+)?$");
        }
    }

    [Fact]
    public void Each_day_reports_its_stop_count_and_total_driving()
    {
        // Traces to: L2-090 AC5
        var summaries = _weekend.GetProperty("days").EnumerateArray()
            .ToDictionary(d => d.GetProperty("day").GetString()!);
        foreach (var day in Days())
        {
            var summary = summaries[day.Key];
            summary.GetProperty("stopCount").GetInt32().Should().Be(day.Count(b => StopNumber(b) is not null));
            summary.GetProperty("drivingMinutes").GetInt32().Should().Be(
                day.Select(Leg).Where(l => l is not null).Sum(l => l!.Value.GetProperty("minutes").GetInt32()));
        }
    }
}
