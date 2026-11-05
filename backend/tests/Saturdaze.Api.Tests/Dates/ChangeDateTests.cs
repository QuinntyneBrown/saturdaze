// Acceptance Test
// Traces to: L2-223 AC1-AC7
// Description: A date carries a nearby activity, and the couple swaps, drops, moves, regenerates and cancels it.

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.Dates;

public class ChangeDateTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public ChangeDateTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = FakeWeatherClient.Sunny;
    }

    private static string DatePath(Guid weekendId, JsonElement date) => $"/api/weekends/{weekendId}/dates/{DatePlans.Id(date)}";

    private static async Task<JsonElement> Post(HttpClient c, string path) => await Plans.ReadAsync(await c.PostAsync(path, null));

    private static async Task<JsonElement> Weekend(HttpClient c, Guid id) => await Plans.ReadAsync(await c.GetAsync($"/api/weekends/{id}"));

    [Fact]
    public async Task The_activity_comes_before_dinner_and_after_lunch()
    {
        // Traces to: L2-223 AC1
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);

        var dinner = await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });
        var lunch = await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Saturday", Meal = "Lunch" });

        var dinnerActivity = DatePlans.Steps(dinner, "Activity").Should().ContainSingle().Subject;
        DatePlans.Minutes(DatePlans.Start(dinnerActivity), DatePlans.End(dinnerActivity)).Should().Be(60);
        DatePlans.End(dinnerActivity).Should().BeOnOrBefore(DatePlans.Start(DatePlans.Steps(dinner, "Meal")[0]));
        var lunchActivity = DatePlans.Steps(lunch, "Activity").Should().ContainSingle().Subject;
        DatePlans.Start(lunchActivity).Should().BeOnOrAfter(DatePlans.End(DatePlans.Steps(lunch, "Meal")[0]));
        dinner.GetProperty("activity").GetProperty("name").GetString().Should().Be(Plans.Title(dinnerActivity));
    }

    [Fact]
    public async Task Swapping_the_restaurant_never_offers_one_swapped_away_and_ends_when_none_is_left()
    {
        // Traces to: L2-223 AC2
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var date = await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });
        var seen = new List<string> { DatePlans.RestaurantName(date) };

        HttpResponseMessage response;
        while ((response = await session.Client.PostAsync($"{DatePath(weekendId, date)}/swap-restaurant", null)).IsSuccessStatusCode)
        {
            var swapped = await Plans.ReadAsync(response);
            swapped.GetProperty("meal").GetString().Should().Be("Dinner");
            seen.Should().NotContain(DatePlans.RestaurantName(swapped));
            seen.Add(DatePlans.RestaurantName(swapped));
            seen.Count.Should().BeLessThan(20);
        }

        seen.Count.Should().BeGreaterThanOrEqualTo(2);
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await response.Content.ReadAsStringAsync()).Should().Contain("no_restaurant_fits");
        var after = (await DatePlans.ListAsync(session.Client, weekendId)).GetProperty("dates")[0];
        DatePlans.RestaurantName(after).Should().Be(seen[^1]);
    }

    [Fact]
    public async Task Dropping_the_activity_leaves_just_the_meal_and_swapping_brings_one_back()
    {
        // Traces to: L2-223 AC3
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var date = await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });

        var dropped = await Plans.ReadAsync(await session.Client.DeleteAsync($"{DatePath(weekendId, date)}/activity"));
        var back = await Post(session.Client, $"{DatePath(weekendId, date)}/swap-activity");

        dropped.GetProperty("activity").ValueKind.Should().Be(JsonValueKind.Null);
        DatePlans.Steps(dropped, "Activity").Should().BeEmpty();
        back.GetProperty("activity").ValueKind.Should().Be(JsonValueKind.Object);
        DatePlans.Steps(back, "Activity").Should().ContainSingle();
    }

    [Fact]
    public async Task Moving_a_date_replans_it_on_the_new_day_and_meal()
    {
        // Traces to: L2-223 AC4
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var date = await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });

        var moved = await Plans.ReadAsync(await session.Client.PutAsJsonAsync(DatePath(weekendId, date), new { Day = "Saturday", Meal = "Lunch" }));

        DatePlans.Id(moved).Should().Be(DatePlans.Id(date));
        moved.GetProperty("day").GetString().Should().Be("Saturday");
        moved.GetProperty("meal").GetString().Should().Be("Lunch");
        DatePlans.Start(DatePlans.Steps(moved, "Meal")[0]).Should().BeOnOrAfter(new TimeOnly(11, 30));
        var weekend = await Weekend(session.Client, weekendId);
        Plans.OfKind(weekend, "Date", "Sunday").Should().BeEmpty();
        Plans.OfKind(weekend, "Date", "Saturday").Should().ContainSingle();
    }

    [Fact]
    public async Task Moving_onto_a_meal_and_day_that_has_a_date_is_refused()
    {
        // Traces to: L2-223 AC5
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var dinner = await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });
        await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Breakfast" });

        var response = await session.Client.PutAsJsonAsync(DatePath(weekendId, dinner), new { Day = "Sunday", Meal = "Breakfast" });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await response.Content.ReadAsStringAsync()).Should().Contain("date_slot_taken");
        (await DatePlans.ListAsync(session.Client, weekendId)).GetProperty("dates").EnumerateArray()
            .Select(d => d.GetProperty("meal").GetString()).Should().Equal("Breakfast", "Dinner");
    }

    [Fact]
    public async Task Regenerating_keeps_the_meal_day_and_people_and_picks_another_restaurant()
    {
        // Traces to: L2-223 AC6
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var date = await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });

        var regenerated = await Post(session.Client, $"{DatePath(weekendId, date)}/regenerate");

        regenerated.GetProperty("meal").GetString().Should().Be("Dinner");
        regenerated.GetProperty("day").GetString().Should().Be("Sunday");
        DatePlans.AttendeeNames(regenerated).Should().BeEquivalentTo(DatePlans.AttendeeNames(date));
        DatePlans.RestaurantName(regenerated).Should().NotBe(DatePlans.RestaurantName(date));
    }

    [Fact]
    public async Task Cancelling_removes_the_date_and_its_block()
    {
        // Traces to: L2-223 AC7
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var date = await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });

        var response = await session.Client.DeleteAsync(DatePath(weekendId, date));

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await DatePlans.ListAsync(session.Client, weekendId)).GetProperty("dates").GetArrayLength().Should().Be(0);
        Plans.OfKind(await Weekend(session.Client, weekendId), "Date").Should().BeEmpty();
    }
}
