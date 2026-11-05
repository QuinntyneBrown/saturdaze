using FluentAssertions;
using Saturdaze.Application.Dates;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Planning;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Domain.ValueObjects;
using Xunit;

namespace Saturdaze.Application.Tests.Dates;

/// <summary>The date planner on its own (L2-219, L2-222 → L2-224).</summary>
public class DatePlannerTests
{
    private static readonly GeoLocation Home = new() { Latitude = 43.5547m, Longitude = -79.5816m, Address = "Home" };
    private static readonly GeoLocation Harbour = new() { Latitude = 43.5498m, Longitude = -79.5853m, Address = "Harbour" };
    private static readonly GeoLocation Park = new() { Latitude = 43.553m, Longitude = -79.583m, Address = "Park" };

    private static readonly FamilyMember Ada = new() { Id = Guid.NewGuid(), Name = "Ada", Age = 41 };
    private static readonly FamilyMember Ben = new() { Id = Guid.NewGuid(), Name = "Ben", Age = 39 };

    private static Restaurant Restaurant(string name, MealSlot slot, int drive, string style = "") =>
        new() { Id = Guid.NewGuid(), Name = name, Slot = slot, DriveMinutes = drive, WifeApproved = true, Style = style, Geo = Harbour };

    private static Activity Activity(string name, TimeOnly? opens = null, TimeOnly? closes = null, bool indoor = true) =>
        new()
        {
            Id = Guid.NewGuid(), Name = name, Indoor = indoor, MinAge = 0, MaxAge = 99, DriveMinutes = 5,
            TypicalDurationMinutes = 90, Category = "Gallery", MapUrl = "u", Geo = Park, OpensAt = opens, ClosesAt = closes,
        };

    private static DateRequest Request(
        IReadOnlyList<Restaurant> restaurants, IReadOnlyList<Activity>? activities = null,
        MealSlot meal = MealSlot.Dinner, IReadOnlyList<BusyTime>? busy = null, params Preference[] preferences)
    {
        var family = new Family { Id = Guid.NewGuid(), Members = new() { Ada, Ben }, Preferences = preferences.ToList() };
        var ctx = new PlannerContext(family, new DateOnly(2026, 5, 16), activities ?? Array.Empty<Activity>(), restaurants,
            Array.Empty<LocalEvent>(), Array.Empty<WeatherForecast>(), Array.Empty<HistoricalActivity>(), Home);
        return new DateRequest(ctx, new[] { Ada, Ben }, DayOfWeekend.Sunday, meal, busy ?? Array.Empty<BusyTime>(),
            new Dictionary<Guid, int>(), null, new HashSet<Guid>(), new HashSet<Guid>(), WithActivity: true);
    }

    [Fact]
    public void The_same_request_plans_the_same_date()
    {
        var request = Request(new[] { Restaurant("A", MealSlot.Dinner, 5), Restaurant("B", MealSlot.Dinner, 5) },
            new[] { Activity("Gallery") });

        var first = new DatePlanner().Plan(request);
        var second = new DatePlanner().Plan(request);

        second.Restaurant.Id.Should().Be(first.Restaurant.Id);
        second.Steps.Should().BeEquivalentTo(first.Steps);
    }

    [Fact]
    public void A_free_evening_starts_dinner_at_the_start_of_its_window()
    {
        var plan = new DatePlanner().Plan(Request(new[] { Restaurant("A", MealSlot.Dinner, 5) }));

        var meal = plan.Steps.Single(s => s.Kind == "Meal");
        meal.StartTime.Should().Be(new TimeOnly(17, 30));
        meal.EndTime.Should().Be(new TimeOnly(19, 0));
        plan.Start.Should().Be(new TimeOnly(17, 25));
        plan.End.Should().Be(new TimeOnly(19, 5));
    }

    [Fact]
    public void Busy_time_over_every_start_is_a_clash_that_names_it()
    {
        var act = () => new DatePlanner().Plan(Request(new[] { Restaurant("A", MealSlot.Breakfast, 5) }, meal: MealSlot.Breakfast,
            busy: new[] { new BusyTime(new TimeOnly(8, 30), new TimeOnly(9, 30), "Swim") }));

        act.Should().Throw<ConflictException>().Where(e => e.Code == "date_clash" && e.Message.Contains("Swim"));
    }

    [Fact]
    public void A_disliked_style_or_another_meal_leaves_no_restaurant()
    {
        var act = () => new DatePlanner().Plan(Request(
            new[] { Restaurant("Fish", MealSlot.Dinner, 5, "Seafood"), Restaurant("Diner", MealSlot.Lunch, 5) },
            preferences: new Preference { Id = Guid.NewGuid(), Kind = PreferenceKind.Dislike, Value = "seafood" }));

        act.Should().Throw<ConflictException>().Where(e => e.Code == "no_restaurant_fits" && e.Message.Contains("dinner"));
    }

    [Fact]
    public void An_activity_closed_for_the_visit_is_skipped_for_one_that_is_open()
    {
        var plan = new DatePlanner().Plan(Request(new[] { Restaurant("A", MealSlot.Dinner, 5) },
            new[] { Activity("Closed early", closes: new TimeOnly(15, 0)), Activity("Open late", closes: new TimeOnly(20, 0)) }));

        plan.Activity!.Name.Should().Be("Open late");
        var activity = plan.Steps.Single(s => s.Kind == "Activity");
        activity.EndTime.Should().BeOnOrBefore(plan.Steps.Single(s => s.Kind == "Meal").StartTime);
        activity.Reason.Should().Contain("min from A");
    }
}
