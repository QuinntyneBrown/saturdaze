// Acceptance Test
// Traces to: L2-219 AC1-AC5, L2-224 AC5
// Description: A date for two adults is planned on the weekend, re-asking returns it, and the list says who can go.

using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Dates;

public class PlanDateTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public PlanDateTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = FakeWeatherClient.Sunny;
    }

    [Fact]
    public async Task A_sunday_dinner_date_is_a_drive_a_dinner_in_its_window_and_a_drive_home()
    {
        // Traces to: L2-219 AC1
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);

        var date = await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });

        date.GetProperty("meal").GetString().Should().Be("Dinner");
        date.GetProperty("day").GetString().Should().Be("Sunday");
        DatePlans.AttendeeNames(date).Should().BeEquivalentTo("Ada", "Ben");
        var meal = DatePlans.Steps(date, "Meal").Should().ContainSingle().Subject;
        DatePlans.Minutes(DatePlans.Start(meal), DatePlans.End(meal)).Should().Be(90);
        DatePlans.Start(meal).Should().BeOnOrAfter(new TimeOnly(17, 30));
        DatePlans.End(meal).Should().BeOnOrBefore(new TimeOnly(21, 0));
        var steps = DatePlans.Steps(date);
        steps[0].GetProperty("kind").GetString().Should().Be("Drive");
        steps[^1].GetProperty("kind").GetString().Should().Be("Drive");
        DatePlans.Start(steps[0]).Should().Be(DatePlans.Start(date));
        DatePlans.End(steps[^1]).Should().Be(DatePlans.End(date));
        DatePlans.Minutes(DatePlans.Start(date), DatePlans.End(date)).Should().BeInRange(90, 210);
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Restaurants.Single(r => r.Id == DatePlans.RestaurantId(date)).Slot.Should().Be(MealSlot.Dinner);
    }

    [Fact]
    public async Task Asking_again_for_the_same_meal_and_day_returns_the_same_date()
    {
        // Traces to: L2-219 AC2
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var first = await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });

        var again = await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });

        DatePlans.Id(again).Should().Be(DatePlans.Id(first));
        DatePlans.RestaurantId(again).Should().Be(DatePlans.RestaurantId(first));
        again.GetProperty("startTime").GetString().Should().Be(first.GetProperty("startTime").GetString());
        (await DatePlans.ListAsync(session.Client, weekendId)).GetProperty("dates").GetArrayLength().Should().Be(1);
    }

    [Fact]
    public async Task Without_attendees_the_two_oldest_adults_go()
    {
        // Traces to: L2-219 AC3
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory, new
        {
            Members = new[]
            {
                new { Name = "Ada", Age = 41 }, new { Name = "Ben", Age = 39 },
                new { Name = "Gran", Age = 72 }, new { Name = "Cy", Age = 9 },
            },
        });

        var date = await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Lunch" });

        DatePlans.AttendeeNames(date).Should().BeEquivalentTo("Gran", "Ada");
    }

    [Fact]
    public async Task The_list_says_whether_a_date_can_be_planned()
    {
        // Traces to: L2-219 AC4
        var (one, oneWeekend) = await DatePlans.FamilyWithWeekendAsync(_factory, new
        {
            Members = new[] { new { Name = "Solo", Age = 40 }, new { Name = "Kid", Age = 8 } },
        });
        var (two, twoWeekend) = await DatePlans.FamilyWithWeekendAsync(_factory);

        var single = await DatePlans.ListAsync(one.Client, oneWeekend);
        var couple = await DatePlans.ListAsync(two.Client, twoWeekend);

        single.GetProperty("canPlan").GetBoolean().Should().BeFalse();
        single.GetProperty("reason").GetString().Should().Contain("two adults");
        couple.GetProperty("canPlan").GetBoolean().Should().BeTrue();
        couple.GetProperty("adults").EnumerateArray().Select(a => a.GetProperty("name").GetString())
            .Should().Equal("Ada", "Ben");
    }

    [Fact]
    public async Task Two_dates_on_one_day_are_listed_in_time_order()
    {
        // Traces to: L2-219 AC5, L2-224 AC5
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });
        await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Breakfast" });

        var list = (await DatePlans.ListAsync(session.Client, weekendId)).GetProperty("dates").EnumerateArray().ToList();

        list.Select(d => d.GetProperty("meal").GetString()).Should().Equal("Breakfast", "Dinner");
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        foreach (var d in list)
        {
            db.Restaurants.Any(r => r.Id == DatePlans.RestaurantId(d)).Should().BeTrue();
            if (d.GetProperty("activity").ValueKind != System.Text.Json.JsonValueKind.Null)
                db.Activities.Any(a => a.Id == d.GetProperty("activity").GetProperty("id").GetGuid()).Should().BeTrue();
        }
    }
}
