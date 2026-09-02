using FluentAssertions;
using Saturdaze.Application.Planning;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Planning;

public class WeekendPlannerDriveAndErrandTests
{
    private static readonly DateOnly Sat = new(2026, 5, 16);
    private static readonly DateOnly Sun = new(2026, 5, 17);

    /// <summary>Only a 9:00–10:30 gap is left on Saturday; Sunday is fully committed.</summary>
    private static PlannerInputsBuilder NinetyMinuteSaturdayGap() => new PlannerInputsBuilder()
        .WeekendOf(Sat)
        .Members(("Q", 41), ("T", 9))
        .Forecast(Sat, false, "sunny", "warm")
        .Forecast(Sun, false, "sunny", "warm")
        .Commitment(DayOfWeek.Saturday, new TimeOnly(10, 30), new TimeOnly(21, 0), "Busy")
        .Commitment(DayOfWeek.Sunday, new TimeOnly(9, 0), new TimeOnly(19, 30), "Busy");

    [Fact]
    public void Activity_whose_drives_leave_no_real_stay_is_skipped()
    {
        // 2 × 50 min drives + 30 min minimum stay = 130 > 90-minute gap.
        var inputs = NinetyMinuteSaturdayGap()
            .Activity("Far Zoo", drive: 50, duration: 60, weatherTags: new[] { "sunny" })
            .Build();

        var blocks = new WeekendPlanner().Plan(inputs);

        blocks.Where(b => b.Day == DayOfWeekend.Saturday)
            .Should().NotContain(b => b.Kind == BlockKind.Activity);
        blocks.Should().OnlyContain(b => b.EndTime > b.StartTime, "no block may end before it starts");
    }

    [Fact]
    public void Activity_with_short_drives_still_fits_the_gap()
    {
        // 2 × 20 + 30 = 70 ≤ 90: eligible, and the clamp trims it to the gap.
        var inputs = NinetyMinuteSaturdayGap()
            .Activity("Near Park", drive: 20, duration: 60, weatherTags: new[] { "sunny" })
            .Build();

        var blocks = new WeekendPlanner().Plan(inputs);

        var activity = blocks.Single(b => b.Day == DayOfWeekend.Saturday && b.Kind == BlockKind.Activity);
        activity.Title.Should().Be("Near Park");
        activity.EndTime.Should().BeAfter(activity.StartTime);
        blocks.Should().OnlyContain(b => b.EndTime > b.StartTime);
    }

    [Fact]
    public void PlaceErrand_reuses_downtime_after_the_weekend_was_planned()
    {
        var day = DayOfWeekend.Saturday;
        var planned = new List<ItineraryBlock>
        {
            Block(day, new TimeOnly(9, 0), new TimeOnly(10, 0), BlockKind.Commitment, "Swim"),
            Block(day, new TimeOnly(10, 0), new TimeOnly(12, 0), BlockKind.Activity, "Park"),
            Block(day, new TimeOnly(12, 0), new TimeOnly(14, 0), BlockKind.Downtime, "Downtime"),
            Block(day, new TimeOnly(14, 0), new TimeOnly(21, 0), BlockKind.Commitment, "Family visit"),
        };
        var errand = new ShoppingErrand { Id = Guid.NewGuid(), Description = "Costco", EstimatedMinutes = 45 };

        var placed = new WeekendPlanner().PlaceErrand(errand, planned, day);

        placed.Should().NotBeNull();
        placed!.Kind.Should().Be(BlockKind.Errand);
        placed.RefId.Should().Be(errand.Id);
        placed.StartTime.Should().Be(new TimeOnly(12, 0));
        placed.EndTime.Should().Be(new TimeOnly(13, 5), "45 minutes plus the 20-minute buffer");
    }

    [Fact]
    public void PlaceErrand_returns_null_when_the_day_is_full()
    {
        var day = DayOfWeekend.Sunday;
        var planned = new List<ItineraryBlock>
        {
            Block(day, new TimeOnly(9, 0), new TimeOnly(19, 30), BlockKind.Commitment, "All day"),
        };
        var errand = new ShoppingErrand { Id = Guid.NewGuid(), Description = "Costco", EstimatedMinutes = 45 };

        new WeekendPlanner().PlaceErrand(errand, planned, day).Should().BeNull();
    }

    [Fact]
    public void FillDowntime_covers_only_gaps_of_at_least_the_minimum()
    {
        var day = DayOfWeekend.Saturday;
        var planned = new List<ItineraryBlock>
        {
            Block(day, new TimeOnly(9, 0), new TimeOnly(12, 0), BlockKind.Activity, "Morning"),
            Block(day, new TimeOnly(12, 15), new TimeOnly(13, 0), BlockKind.Meal, "Lunch"),   // 15-min gap: too short
            Block(day, new TimeOnly(15, 0), new TimeOnly(21, 0), BlockKind.Commitment, "Rest"), // 2-hour gap
        };

        var downtime = new WeekendPlanner().FillDowntime(day, planned);

        downtime.Should().ContainSingle();
        downtime[0].StartTime.Should().Be(new TimeOnly(13, 0));
        downtime[0].EndTime.Should().Be(new TimeOnly(15, 0));
    }

    private static ItineraryBlock Block(DayOfWeekend day, TimeOnly start, TimeOnly end, BlockKind kind, string title)
        => new() { Id = Guid.NewGuid(), Day = day, StartTime = start, EndTime = end, Kind = kind, Title = title };
}
