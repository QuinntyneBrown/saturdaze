// Acceptance Test
// Traces to: L2-148, L2-019 AC1
// Description: Only family members vote, votes report the lock for their day and slot,
// and restaurant picks need a day and a slot.

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Catalog;

public class RestaurantVotingTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public RestaurantVotingTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = (_, _, from, to) =>
        {
            var days = new List<WeatherForecast>();
            for (var d = from; d <= to; d = d.AddDays(1))
                days.Add(new WeatherForecast(d, new[] { "sunny" }, 24, 16, 0.0, false));
            return days;
        };
    }

    private async Task<HttpClient> TheBrowns()
    {
        var client = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        (await client.PutAsJsonAsync("/api/family", new
        {
            Members = new[]
            {
                new { Name = "Quinn", Age = 41 }, new { Name = "Sara", Age = 39 },
                new { Name = "Eli", Age = 9 }, new { Name = "Mae", Age = 5 },
            },
        })).EnsureSuccessStatusCode();
        return client;
    }

    private static async Task<Guid> FirstLunchPick(HttpClient client)
    {
        var picks = await client.GetAsync("/api/restaurants?day=2026-05-16&slot=Lunch&wifeApprovedOnly=false");
        picks.EnsureSuccessStatusCode();
        return JsonDocument.Parse(await picks.Content.ReadAsStringAsync()).RootElement[0].GetProperty("id").GetGuid();
    }

    [Fact]
    public async Task A_vote_for_someone_outside_the_family_is_refused()
    {
        // Traces to: L2-148 AC1
        var client = await TheBrowns();
        var id = await FirstLunchPick(client);

        var response = await client.PostAsJsonAsync($"/api/restaurants/{id}/vote", new { VoterName = "Mallory", Vote = "up" });
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, body);
        body.Should().Contain("voterName", Exactly.Once(), "the error names the field");
        var after = await client.GetAsync("/api/restaurants?day=2026-05-16&slot=Lunch&wifeApprovedOnly=false");
        (await after.Content.ReadAsStringAsync()).Should().NotContain("Mallory");
    }

    [Fact]
    public async Task A_vote_is_recorded_under_the_members_own_name()
    {
        // Traces to: L2-148 AC2
        var client = await TheBrowns();
        var id = await FirstLunchPick(client);

        var response = await client.PostAsJsonAsync($"/api/restaurants/{id}/vote", new { VoterName = "quinn", Vote = "up" });
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        JsonDocument.Parse(body).RootElement.GetProperty("votes").EnumerateArray()
            .Select(v => v.GetProperty("voterName").GetString())
            .Should().Equal("Quinn");
    }

    [Fact]
    public async Task A_vote_reports_the_lock_for_the_day_and_slot_it_was_cast_from()
    {
        // Traces to: L2-148 AC3
        var client = await TheBrowns();
        var id = await FirstLunchPick(client);
        (await client.PostAsJsonAsync($"/api/restaurants/{id}/lock", new { Day = "Saturday", Slot = "Lunch" }))
            .EnsureSuccessStatusCode();

        async Task<bool> LockedFrom(string day)
        {
            var response = await client.PostAsJsonAsync($"/api/restaurants/{id}/vote",
                new { VoterName = "Sara", Vote = "up", Day = day, Slot = "Lunch" });
            var body = await response.Content.ReadAsStringAsync();
            response.StatusCode.Should().Be(HttpStatusCode.OK, body);
            return JsonDocument.Parse(body).RootElement.GetProperty("locked").GetBoolean();
        }

        (await LockedFrom("Sunday")).Should().BeFalse();
        (await LockedFrom("Saturday")).Should().BeTrue();
    }

    [Theory]
    [InlineData("/api/restaurants?slot=Lunch", "day")]
    [InlineData("/api/restaurants?day=2026-05-16", "slot")]
    public async Task Picks_without_a_day_or_slot_name_the_missing_field(string url, string field)
    {
        // Traces to: L2-019 AC1
        var client = (await SignedInClient.CreateAsync(_factory)).Client;

        var response = await client.GetAsync(url);
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, body);
        JsonDocument.Parse(body).RootElement.GetProperty("errors").EnumerateObject()
            .Select(p => p.Name).Should().Contain(name => string.Equals(name, field, StringComparison.OrdinalIgnoreCase));
    }
}
