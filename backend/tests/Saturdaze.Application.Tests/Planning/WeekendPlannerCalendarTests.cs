using FluentAssertions;
using Saturdaze.Application.Planning;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Planning;

/// <summary>
/// Events from a connected calendar join the planner's fixed blocks after the
/// profile commitments and the carried-over locked blocks (L2-177).
/// </summary>
public class WeekendPlannerCalendarTests
{
    private static readonly DateOnly Sat = new(2026, 5, 16);
    private static readonly DateOnly Sun = new(2026, 5, 17);

    private static PlannerInputsBuilder Baseline() => new PlannerInputsBuilder()
        .WeekendOf(Sat)
        .Members(("Quinn", 41), ("Theo", 9))
        .Forecast(Sat, false, "sunny", "warm")
        .Forecast(Sun, false, "mild")
        .Restaurant("Snug Harbour", MealSlot.Dinner, drive: 5)
        .Restaurant("Cora", MealSlot.Lunch, drive: 5)
        .Activity("Park", drive: 5, duration: 90, weatherTags: new[] { "sunny", "warm" });

    private static IEnumerable<ItineraryBlock> FromCalendar(IEnumerable<ItineraryBlock> blocks) =>
        blocks.Where(b => b.FromCalendar);

    private static void NoOverlaps(IReadOnlyList<ItineraryBlock> blocks)
    {
        foreach (var day in blocks.GroupBy(b => b.Day))
        {
            var ordered = day.OrderBy(b => b.StartTime).ToList();
            for (var i = 1; i < ordered.Count; i++)
                ordered[i].StartTime.Should().BeOnOrAfter(ordered[i - 1].EndTime,
                    $"{ordered[i - 1].Title} and {ordered[i].Title} must not overlap");
        }
    }

    [Fact]
    public void A_calendar_event_becomes_a_locked_commitment_block_from_the_calendar()
    {
        // Traces to: L2-177 AC1
        var blocks = new WeekendPlanner().Plan(Baseline()
            .CalendarEvent(DayOfWeekend.Saturday, new TimeOnly(15, 0), new TimeOnly(17, 0), "Ava's birthday party")
            .Build());

        var party = FromCalendar(blocks).Should().ContainSingle().Subject;
        party.Title.Should().Be("Ava's birthday party");
        party.Kind.Should().Be(BlockKind.Commitment);
        party.IsLocked.Should().BeTrue();
        party.Day.Should().Be(DayOfWeekend.Saturday);
        (party.StartTime, party.EndTime).Should().Be((new TimeOnly(15, 0), new TimeOnly(17, 0)));
        NoOverlaps(blocks);
    }

    [Fact]
    public void An_event_overlapping_a_profile_commitment_is_left_out_and_one_that_only_touches_it_is_kept()
    {
        // Traces to: L2-177 AC3
        var blocks = new WeekendPlanner().Plan(Baseline()
            .Commitment(DayOfWeek.Sunday, new TimeOnly(10, 30), new TimeOnly(11, 45), "Church")
            .CalendarEvent(DayOfWeekend.Sunday, new TimeOnly(10, 0), new TimeOnly(10, 30), "Coffee with Sam")
            .CalendarEvent(DayOfWeekend.Sunday, new TimeOnly(10, 15), new TimeOnly(11, 0), "Choir")
            .Build());

        blocks.Should().ContainSingle(b => b.Title == "Church" && !b.FromCalendar);
        FromCalendar(blocks).Select(b => b.Title).Should().BeEquivalentTo("Coffee with Sam");
        NoOverlaps(blocks);
    }

    [Fact]
    public void Events_are_clipped_to_the_planner_day_and_dropped_when_nothing_is_left()
    {
        // Traces to: L2-177 AC4
        var blocks = new WeekendPlanner().Plan(Baseline()
            .CalendarEvent(DayOfWeekend.Saturday, new TimeOnly(7, 0), new TimeOnly(10, 0), "Early hockey")
            .CalendarEvent(DayOfWeekend.Saturday, new TimeOnly(22, 0), new TimeOnly(23, 0), "Late show")
            .Build());

        var hockey = FromCalendar(blocks).Should().ContainSingle().Subject;
        hockey.Title.Should().Be("Early hockey");
        (hockey.StartTime, hockey.EndTime).Should().Be((PlannerTimes.DayStart, new TimeOnly(10, 0)));
    }

    [Fact]
    public void A_clipped_event_that_overlaps_a_profile_commitment_is_left_out()
    {
        // Traces to: L2-177 AC4
        var blocks = new WeekendPlanner().Plan(Baseline()
            .Commitment(DayOfWeek.Saturday, new TimeOnly(9, 0), new TimeOnly(10, 0), "Swim")
            .CalendarEvent(DayOfWeekend.Saturday, new TimeOnly(7, 0), new TimeOnly(10, 0), "Early hockey")
            .Build());

        FromCalendar(blocks).Should().BeEmpty();
        NoOverlaps(blocks);
    }

    [Fact]
    public void A_carried_over_locked_block_wins_and_the_earlier_of_two_overlapping_events_wins()
    {
        // Traces to: L2-177 (fixed blocks never overlap)
        var blocks = new WeekendPlanner().Plan(Baseline()
            .LockedBlock(new ItineraryBlock
            {
                Id = Guid.NewGuid(), Day = DayOfWeekend.Saturday, Kind = BlockKind.Activity, Title = "Zoo",
                StartTime = new TimeOnly(13, 0), EndTime = new TimeOnly(15, 0), IsLocked = true,
            })
            .CalendarEvent(DayOfWeekend.Saturday, new TimeOnly(14, 0), new TimeOnly(16, 0), "Dentist")
            .CalendarEvent(DayOfWeekend.Saturday, new TimeOnly(17, 0), new TimeOnly(18, 0), "Pickup")
            .CalendarEvent(DayOfWeekend.Saturday, new TimeOnly(17, 30), new TimeOnly(18, 30), "Call")
            .Build());

        FromCalendar(blocks).Select(b => b.Title).Should().BeEquivalentTo("Pickup");
        NoOverlaps(blocks);
    }
}
