using FluentAssertions;
using Saturdaze.Application.Exceptions;
using Saturdaze.Application.Planning;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Planning;

public class WeekendPlannerTests
{
    private static readonly DateOnly Sat = new(2026, 5, 16);
    private static readonly DateOnly Sun = new(2026, 5, 17);

    private static PlannerInputsBuilder Baseline() => new PlannerInputsBuilder()
        .WeekendOf(Sat)
        .Members(("Quinn", 41), ("Jennifer", 39), ("Theo", 9), ("Avery", 5))
        .Forecast(Sat, false, "sunny", "warm")
        .Forecast(Sun, false, "mild")
        .Restaurant("Snug Harbour", MealSlot.Dinner, drive: 5)
        .Restaurant("Cora", MealSlot.Lunch, drive: 5);

    [Fact]
    public void Commitments_are_placed_as_immovable_blocks()
    {
        var inputs = Baseline()
            .Commitment(DayOfWeek.Saturday, new TimeOnly(9, 30), new TimeOnly(10, 30), "Swim")
            .Commitment(DayOfWeek.Sunday, new TimeOnly(10, 30), new TimeOnly(12, 0), "Church")
            .Activity("Park", drive: 5, duration: 90, weatherTags: new[] { "sunny", "warm" })
            .Build();

        var blocks = new WeekendPlanner().Plan(inputs);

        blocks.Should().Contain(b => b.Title == "Swim" && b.Kind == BlockKind.Commitment
            && b.Day == DayOfWeekend.Saturday && b.StartTime == new TimeOnly(9, 30));
        blocks.Should().Contain(b => b.Title == "Church" && b.Kind == BlockKind.Commitment
            && b.Day == DayOfWeekend.Sunday && b.StartTime == new TimeOnly(10, 30));
    }

    [Fact]
    public void Overlapping_commitments_raise_conflict()
    {
        var inputs = Baseline()
            .Commitment(DayOfWeek.Saturday, new TimeOnly(9, 0),  new TimeOnly(10, 30), "A")
            .Commitment(DayOfWeek.Saturday, new TimeOnly(10, 0), new TimeOnly(11, 0),  "B")
            .Activity("Park")
            .Build();
        var act = () => new WeekendPlanner().Plan(inputs);
        act.Should().Throw<ConflictException>().WithMessage("*overlap*");
    }

    [Fact]
    public void Indoor_picked_when_forecast_is_rain()
    {
        var inputs = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41), ("T", 9))
            .Forecast(Sat, false, "rain", "cool")
            .Forecast(Sun, false, "rain", "cool")
            .Activity("Outdoor Park",  indoor: false, drive: 5, duration: 90, weatherTags: new[] { "sunny", "warm" })
            .Activity("Indoor Museum", indoor: true,  drive: 5, duration: 90, weatherTags: new[] { "rain", "cold" })
            .Restaurant("R", MealSlot.Lunch, drive: 5)
            .Build();

        var blocks = new WeekendPlanner().Plan(inputs);
        blocks.Should().Contain(b => b.Kind == BlockKind.Activity && b.Title == "Indoor Museum");
        blocks.Should().NotContain(b => b.Kind == BlockKind.Activity && b.Title == "Outdoor Park");
    }

    [Fact]
    public void Outdoor_picked_when_forecast_is_sunny_warm()
    {
        var inputs = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41))
            .Forecast(Sat, false, "sunny", "warm")
            .Forecast(Sun, false, "sunny", "warm")
            .Activity("Outdoor Park",  indoor: false, drive: 5, duration: 90, weatherTags: new[] { "sunny", "warm" })
            .Activity("Indoor Museum", indoor: true,  drive: 5, duration: 90, weatherTags: new[] { "rain" })
            .Restaurant("R", MealSlot.Lunch, drive: 5)
            .Build();

        var blocks = new WeekendPlanner().Plan(inputs);
        blocks.Should().Contain(b => b.Kind == BlockKind.Activity && b.Title == "Outdoor Park");
    }

    [Fact]
    public void Disqualifies_activity_when_two_members_outside_age_window()
    {
        // Teen-only activity (min age 12). Two members (5 and 9) outside → must be skipped.
        var inputs = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41), ("Theo", 9), ("Avery", 5))
            .Forecast(Sat, false, "sunny")
            .Forecast(Sun, false, "sunny")
            .Activity("Teen-only Escape", indoor: true, minAge: 12, drive: 5, duration: 90, weatherTags: new[] { "rain" })
            .Activity("Family Park",      indoor: false, minAge: 0, drive: 5, duration: 90, weatherTags: new[] { "sunny" })
            .Restaurant("R", MealSlot.Lunch, drive: 5)
            .Build();

        var blocks = new WeekendPlanner().Plan(inputs);
        blocks.Should().NotContain(b => b.Title == "Teen-only Escape");
        blocks.Should().Contain(b => b.Title == "Family Park");
    }

    [Fact]
    public void Disqualifies_activity_matching_disliked_tag()
    {
        var inputs = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41))
            .Forecast(Sat, false, "sunny")
            .Forecast(Sun, false, "sunny")
            .Preference(PreferenceKind.Dislike, "long-drive")
            .Activity("Faraway Place", indoor: false, drive: 60, duration: 120,
                      description: "long-drive worth it", weatherTags: new[] { "sunny" })
            .Activity("Close Park",    indoor: false, drive: 5,  duration: 90,
                      weatherTags: new[] { "sunny" })
            .Restaurant("R", MealSlot.Lunch, drive: 5)
            .Build();

        var blocks = new WeekendPlanner().Plan(inputs);
        blocks.Should().NotContain(b => b.Title == "Faraway Place");
    }

    [Fact]
    public void Recency_penalty_one_week_back_demotes_activity()
    {
        var builder = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41))
            .Forecast(Sat, false, "sunny")
            .Forecast(Sun, false, "sunny")
            .Activity("Recent",  indoor: false, drive: 5, duration: 90, weatherTags: new[] { "sunny" });
        var recentId = builder.LastActivityId();
        builder
            .Activity("Fresh", indoor: false, drive: 5, duration: 90, weatherTags: new[] { "sunny" })
            .Restaurant("R", MealSlot.Lunch, drive: 5)
            .HistoricalActivityWeeksAgo(recentId, 1);

        var blocks = new WeekendPlanner().Plan(builder.Build());
        blocks.Should().Contain(b => b.Title == "Fresh");
        blocks.Should().NotContain(b => b.Title == "Recent");
    }

    [Fact]
    public void TryNew_boosts_unused_activity_against_otherwise_equal_used_one()
    {
        var builder = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41))
            .Forecast(Sat, false, "sunny")
            .Forecast(Sun, false, "sunny")
            .TryNew(true);
        builder.Activity("Used",  indoor: false, drive: 5, duration: 90, weatherTags: new[] { "sunny" });
        var usedId = builder.LastActivityId();
        builder.Activity("Never Tried", indoor: false, drive: 5, duration: 90, weatherTags: new[] { "sunny" });
        builder.Restaurant("R", MealSlot.Lunch, drive: 5);
        builder.HistoricalActivityWeeksAgo(usedId, 10); // out of recency window

        var blocks = new WeekendPlanner().Plan(builder.Build());
        blocks.Should().Contain(b => b.Title == "Never Tried");
    }

    [Fact]
    public void Drive_blocks_are_inserted_before_and_after_activity_when_drive_minutes_positive()
    {
        var inputs = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41))
            .Forecast(Sat, false, "sunny")
            .Forecast(Sun, false, "sunny")
            .Activity("Toronto Zoo", indoor: false, drive: 30, duration: 180, weatherTags: new[] { "sunny" })
            .Restaurant("R", MealSlot.Lunch, drive: 5)
            .Build();

        var blocks = new WeekendPlanner().Plan(inputs);
        var sat = blocks.Where(b => b.Day == DayOfWeekend.Saturday).OrderBy(b => b.StartTime).ToList();
        var drives = sat.Where(b => b.Kind == BlockKind.Drive).ToList();
        drives.Should().HaveCountGreaterOrEqualTo(2,
            "one drive-out and one drive-home should bracket the activity");
        drives.Select(d => d.EndTime - d.StartTime).Should().OnlyContain(t => t == TimeSpan.FromMinutes(30));
    }

    [Fact]
    public void Meal_placed_within_lunch_window_by_default()
    {
        var inputs = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41))
            .Forecast(Sat, false, "sunny")
            .Forecast(Sun, false, "sunny")
            .Activity("Park", drive: 5, duration: 90, weatherTags: new[] { "sunny" })
            .Restaurant("Cora", MealSlot.Lunch, drive: 5)
            .Build();
        var blocks = new WeekendPlanner().Plan(inputs);
        var lunch = blocks.Single(b => b.Day == DayOfWeekend.Saturday && b.Kind == BlockKind.Meal && b.Title.Contains("Lunch"));
        lunch.StartTime.Should().BeOnOrAfter(PlannerTimes.LunchWindowStart);
        lunch.EndTime.Should().BeOnOrBefore(PlannerTimes.LunchWindowEnd);
    }

    [Fact]
    public void Errand_prefers_saturday_morning_when_available()
    {
        var inputs = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41))
            .Forecast(Sat, false, "sunny")
            .Forecast(Sun, false, "sunny")
            .Activity("Park", drive: 5, duration: 90, weatherTags: new[] { "sunny" })
            .Restaurant("R", MealSlot.Lunch, drive: 5)
            .Errand(estimatedMinutes: 40, description: "Costco run")
            .Build();
        var blocks = new WeekendPlanner().Plan(inputs);
        var errand = blocks.Single(b => b.Kind == BlockKind.Errand);
        errand.Day.Should().Be(DayOfWeekend.Saturday);
        errand.StartTime.Should().BeBefore(new TimeOnly(12, 0));
    }

    [Fact]
    public void Determinism_same_inputs_and_seed_produce_identical_output()
    {
        // Two equally-good candidates → seed picks among them. Same seed must pick the same one twice.
        var b = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41))
            .Forecast(Sat, false, "sunny")
            .Forecast(Sun, false, "sunny")
            .Activity("Alpha", drive: 5, duration: 90, weatherTags: new[] { "sunny" })
            .Activity("Bravo", drive: 5, duration: 90, weatherTags: new[] { "sunny" })
            .Restaurant("R", MealSlot.Lunch, drive: 5)
            .Seed(42);
        var first  = new WeekendPlanner().Plan(b.Build()).Select(x => (x.Day, x.StartTime, x.Title)).ToList();
        var second = new WeekendPlanner().Plan(b.Build()).Select(x => (x.Day, x.StartTime, x.Title)).ToList();
        second.Should().Equal(first);
    }

    [Fact]
    public void Weather_unavailable_marks_reason_and_does_not_disqualify_activities()
    {
        var inputs = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41))
            .Forecast(Sat, unavailable: true)
            .Forecast(Sun, unavailable: true)
            .Activity("Park", indoor: false, drive: 5, duration: 90, weatherTags: new[] { "sunny" })
            .Restaurant("R", MealSlot.Lunch, drive: 5)
            .Build();

        var blocks = new WeekendPlanner().Plan(inputs);
        var activities = blocks.Where(b => b.Kind == BlockKind.Activity).ToList();
        activities.Should().NotBeEmpty("weather-unavailable should not disqualify activities");
        activities.Should().OnlyContain(a => a.Reason.Contains("weather unavailable"));
    }

    [Fact]
    public void Locked_block_is_preserved_in_output()
    {
        var lockedId = Guid.NewGuid();
        var inputs = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41))
            .Forecast(Sat, false, "sunny")
            .Forecast(Sun, false, "sunny")
            .Activity("Park", drive: 5, duration: 90, weatherTags: new[] { "sunny" })
            .Restaurant("R", MealSlot.Lunch, drive: 5)
            .LockedBlock(new ItineraryBlock
            {
                Id = lockedId, Day = DayOfWeekend.Saturday,
                StartTime = new TimeOnly(14, 0), EndTime = new TimeOnly(15, 30),
                Kind = BlockKind.Activity, Title = "Locked Special",
                IsLocked = true, Reason = "user-locked"
            })
            .Build();

        var blocks = new WeekendPlanner().Plan(inputs);
        blocks.Should().Contain(b => b.Id == lockedId && b.IsLocked && b.Title == "Locked Special");
    }

    [Fact]
    public void Sunday_plan_ends_by_wind_down_time()
    {
        var inputs = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41))
            .Forecast(Sat, false, "sunny")
            .Forecast(Sun, false, "sunny")
            .Activity("Park", drive: 5, duration: 90, weatherTags: new[] { "sunny" })
            .Restaurant("R", MealSlot.Lunch, drive: 5)
            .Build();

        var blocks = new WeekendPlanner().Plan(inputs);
        var sunBlocks = blocks.Where(b => b.Day == DayOfWeekend.Sunday).ToList();
        sunBlocks.Should().NotBeEmpty();
        sunBlocks.Max(b => b.EndTime).Should().BeOnOrBefore(PlannerTimes.SundayWindDownStart);
    }

    [Fact]
    public void Downtime_fills_gap_when_no_activity_fits()
    {
        // No activities offered → entire day becomes downtime and a lunch slot.
        var inputs = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41))
            .Forecast(Sat, false, "sunny")
            .Forecast(Sun, false, "sunny")
            .Restaurant("R", MealSlot.Lunch, drive: 5)
            .Build();

        var blocks = new WeekendPlanner().Plan(inputs);
        blocks.Where(b => b.Day == DayOfWeekend.Saturday).Should().Contain(b => b.Kind == BlockKind.Downtime);
    }

    [Fact]
    public void Age_fit_includes_member_at_exact_min_age_boundary()
    {
        var inputs = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41), ("Theo", 9))
            .Forecast(Sat, false, "sunny")
            .Forecast(Sun, false, "sunny")
            .Activity("Age9Plus", indoor: false, minAge: 9, maxAge: 99, drive: 5, duration: 90, weatherTags: new[] { "sunny" })
            .Restaurant("R", MealSlot.Lunch, drive: 5)
            .Build();
        var blocks = new WeekendPlanner().Plan(inputs);
        blocks.Should().Contain(b => b.Title == "Age9Plus");
    }

    [Fact]
    public void Drive_penalty_kicks_in_only_above_point_four_of_gap()
    {
        // Gap on Saturday is the full 09:00–21:00 = 720 min day window minus meals/etc, easily 200+ min.
        // Round-trip 30 minutes is well within 0.4 × 200 = 80 min: should be picked.
        var inputs = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41))
            .Forecast(Sat, false, "sunny")
            .Forecast(Sun, false, "sunny")
            .Activity("Reasonable", indoor: false, drive: 15, duration: 90, weatherTags: new[] { "sunny" })
            .Restaurant("R", MealSlot.Lunch, drive: 5)
            .Build();
        new WeekendPlanner().Plan(inputs).Should().Contain(b => b.Title == "Reasonable");
    }

    [Fact]
    public void Recency_no_penalty_beyond_four_weekend_window()
    {
        // Used 5 weekends ago → no penalty. Should still be picked when otherwise equal.
        var builder = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41))
            .Forecast(Sat, false, "sunny")
            .Forecast(Sun, false, "sunny")
            .Activity("Stale", indoor: false, drive: 5, duration: 90, weatherTags: new[] { "sunny" });
        var staleId = builder.LastActivityId();
        builder.Restaurant("R", MealSlot.Lunch, drive: 5)
               .HistoricalActivityWeeksAgo(staleId, 5);
        var blocks = new WeekendPlanner().Plan(builder.Build());
        blocks.Should().Contain(b => b.Title == "Stale");
    }

    [Fact]
    public void Snow_in_forecast_boosts_indoor_activity()
    {
        var inputs = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41))
            .Forecast(Sat, false, "snow", "cold")
            .Forecast(Sun, false, "snow", "cold")
            .Activity("Outdoor", indoor: false, drive: 5, duration: 90, weatherTags: new[] { "sunny" })
            .Activity("Indoor",  indoor: true,  drive: 5, duration: 90, weatherTags: new[] { "snow" })
            .Restaurant("R", MealSlot.Lunch, drive: 5)
            .Build();
        var blocks = new WeekendPlanner().Plan(inputs);
        blocks.Should().Contain(b => b.Kind == BlockKind.Activity && b.Title == "Indoor");
    }

    [Fact]
    public void Blocks_are_returned_sorted_with_increasing_sortorder()
    {
        var inputs = new PlannerInputsBuilder()
            .WeekendOf(Sat)
            .Members(("Q", 41))
            .Forecast(Sat, false, "sunny")
            .Forecast(Sun, false, "sunny")
            .Activity("Park", drive: 5, duration: 90, weatherTags: new[] { "sunny" })
            .Restaurant("R", MealSlot.Lunch, drive: 5)
            .Build();
        var blocks = new WeekendPlanner().Plan(inputs);
        foreach (var day in new[] { DayOfWeekend.Saturday, DayOfWeekend.Sunday })
        {
            var dayBlocks = blocks.Where(b => b.Day == day).ToList();
            dayBlocks.Select(b => b.StartTime).Should().BeInAscendingOrder();
            dayBlocks.Select(b => b.SortOrder).Should().BeInAscendingOrder();
        }
    }
}
