// Acceptance Test
// Traces to: L2-224 AC1-AC4
// Description: A date keeps to the family's drive, dislikes, votes and locks, and says when nothing fits.

using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.Dates;

public class DateProfileTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public DateProfileTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = FakeWeatherClient.Sunny;
        _factory.Geocoder.Fail = false;
        _factory.Geocoder.Delay = TimeSpan.Zero;
    }

    private static async Task<List<System.Text.Json.JsonElement>> Dinners(HttpClient c) =>
        (await Plans.ReadAsync(await c.GetAsync("/api/restaurants?day=2026-05-17&slot=Dinner&take=50"))).EnumerateArray().ToList();

    [Fact]
    public async Task No_breakfast_place_within_the_drive_is_a_clear_conflict()
    {
        // Traces to: L2-224 AC1
        _factory.Geocoder.Add("1 Main St E, Milton", 43.518m, -79.883m);
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        await FamilyProfiles.SaveAsync(session.Client, new { HomeLocation = "1 Main St E, Milton", MaxDriveMinutes = 15 });

        var response = await DatePlans.PostAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Breakfast" });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        var body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("no_restaurant_fits").And.Contain("breakfast");
    }

    [Fact]
    public async Task A_disliked_style_is_never_the_restaurant()
    {
        // Traces to: L2-224 AC2
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        await FamilyProfiles.SaveAsync(session.Client, new { Preferences = FamilyProfiles.Dislikes("Seafood") });

        var date = await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });

        date.GetProperty("restaurant").GetProperty("style").GetString().Should().NotContain("Seafood");
    }

    [Fact]
    public async Task The_familys_votes_lift_a_farther_restaurant()
    {
        // Traces to: L2-224 AC3
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var farthest = (await Dinners(session.Client)).OrderByDescending(r => r.GetProperty("driveMinutes").GetInt32()).First();
        foreach (var voter in new[] { "Ada", "Ben" })
            await Plans.ReadAsync(await session.Client.PostAsJsonAsync($"/api/restaurants/{farthest.GetProperty("id").GetGuid()}/vote",
                new { VoterName = voter, Vote = "up", Day = "Sunday", Slot = "Dinner" }));

        var date = await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });

        DatePlans.RestaurantId(date).Should().Be(farthest.GetProperty("id").GetGuid());
        Plans.Reason(DatePlans.Steps(date, "Meal")[0]).Should().Contain("2 votes up");
    }

    [Fact]
    public async Task A_restaurant_locked_for_that_day_and_meal_comes_first()
    {
        // Traces to: L2-224 AC4
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var pick = (await Dinners(session.Client)).OrderByDescending(r => r.GetProperty("driveMinutes").GetInt32()).Skip(1).First();
        await Plans.ReadAsync(await session.Client.PostAsJsonAsync($"/api/restaurants/{pick.GetProperty("id").GetGuid()}/lock",
            new { Day = "Sunday", Slot = "Dinner" }));

        var date = await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });

        DatePlans.RestaurantId(date).Should().Be(pick.GetProperty("id").GetGuid());
        Plans.Reason(DatePlans.Steps(date, "Meal")[0]).Should().Contain("locked by family vote");
    }
}
