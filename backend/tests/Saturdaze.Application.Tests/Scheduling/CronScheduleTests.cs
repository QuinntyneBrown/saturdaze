using FluentAssertions;
using Saturdaze.Application.Scheduling;
using Xunit;

namespace Saturdaze.Application.Tests.Scheduling;

public class CronScheduleTests
{
    private static DateTime Utc(int y, int mo, int d, int h, int mi, int s)
        => new(y, mo, d, h, mi, s, DateTimeKind.Utc);

    [Fact]
    public void Friday_0800_six_field_returns_next_friday_at_0800()
    {
        var schedule = CronSchedule.Parse("0 0 8 * * 5"); // the design's default cadence
        var after = Utc(2026, 5, 26, 9, 0, 0); // a Tuesday mid-morning

        var next = schedule.GetNextOccurrence(after);

        next.DayOfWeek.Should().Be(DayOfWeek.Friday);
        next.TimeOfDay.Should().Be(new TimeSpan(8, 0, 0));
        next.Should().BeAfter(after);
        (next - after).Should().BeLessThanOrEqualTo(TimeSpan.FromDays(7));
    }

    [Fact]
    public void Every_fifteen_seconds_advances_to_next_quarter_minute()
    {
        var schedule = CronSchedule.Parse("*/15 * * * * *");

        schedule.GetNextOccurrence(Utc(2026, 1, 1, 12, 0, 7)).Should().Be(Utc(2026, 1, 1, 12, 0, 15));
        schedule.GetNextOccurrence(Utc(2026, 1, 1, 12, 0, 15)).Should().Be(Utc(2026, 1, 1, 12, 0, 30));
        schedule.GetNextOccurrence(Utc(2026, 1, 1, 12, 0, 59)).Should().Be(Utc(2026, 1, 1, 12, 1, 0));
    }

    [Fact]
    public void Five_field_daily_defaults_seconds_to_zero()
    {
        var schedule = CronSchedule.Parse("30 9 * * *"); // 09:30 every day

        schedule.GetNextOccurrence(Utc(2026, 5, 28, 9, 0, 0)).Should().Be(Utc(2026, 5, 28, 9, 30, 0));
        // Already past today's slot -> next day.
        schedule.GetNextOccurrence(Utc(2026, 5, 28, 9, 30, 0)).Should().Be(Utc(2026, 5, 29, 9, 30, 0));
    }

    [Fact]
    public void Weekday_range_skips_the_weekend()
    {
        var schedule = CronSchedule.Parse("0 9 * * 1-5"); // 09:00 Mon-Fri

        var next = schedule.GetNextOccurrence(Utc(2026, 5, 29, 10, 0, 0)); // Fri after 9 -> Monday
        next.DayOfWeek.Should().Be(DayOfWeek.Monday);
        next.TimeOfDay.Should().Be(new TimeSpan(9, 0, 0));
    }

    [Fact]
    public void Day_of_month_and_day_of_week_are_unioned_when_both_restricted()
    {
        // Either the 13th OR a Friday, at 12:00.
        var schedule = CronSchedule.Parse("0 0 12 13 * 5");

        // Walk a year of occurrences; every one must satisfy the union rule.
        var cursor = Utc(2026, 1, 1, 0, 0, 0);
        for (var i = 0; i < 60; i++)
        {
            var next = schedule.GetNextOccurrence(cursor);
            next.TimeOfDay.Should().Be(new TimeSpan(12, 0, 0));
            (next.Day == 13 || next.DayOfWeek == DayOfWeek.Friday).Should().BeTrue(
                "{0:u} should match day-of-month 13 or Friday", next);
            cursor = next;
        }

        // And a 13th that is not a Friday is still selected (proves OR, not AND).
        schedule.GetNextOccurrence(Utc(2026, 5, 9, 0, 0, 0))
            .Should().Be(Utc(2026, 5, 13, 12, 0, 0)); // 2026-05-13 is a Wednesday
    }

    [Fact]
    public void Lists_and_steps_combine()
    {
        var schedule = CronSchedule.Parse("0 0,30 8-10/2 * * *"); // :00 and :30 of hours 8 and 10

        var hits = new List<DateTime>();
        var cursor = Utc(2026, 3, 10, 0, 0, 0);
        for (var i = 0; i < 4; i++)
        {
            cursor = schedule.GetNextOccurrence(cursor);
            hits.Add(cursor);
        }

        hits.Should().Equal(
            Utc(2026, 3, 10, 8, 0, 0),
            Utc(2026, 3, 10, 8, 30, 0),
            Utc(2026, 3, 10, 10, 0, 0),
            Utc(2026, 3, 10, 10, 30, 0));
    }

    [Fact]
    public void Sunday_accepts_both_zero_and_seven()
    {
        CronSchedule.Parse("0 0 0 * * 0").GetNextOccurrence(Utc(2026, 5, 28, 0, 0, 0))
            .DayOfWeek.Should().Be(DayOfWeek.Sunday);
        CronSchedule.Parse("0 0 0 * * 7").GetNextOccurrence(Utc(2026, 5, 28, 0, 0, 0))
            .DayOfWeek.Should().Be(DayOfWeek.Sunday);
    }

    [Fact]
    public void Result_is_strictly_after_input_and_truncated_to_whole_seconds()
    {
        var schedule = CronSchedule.Parse("*/15 * * * * *");
        var after = new DateTime(2026, 1, 1, 12, 0, 15, 500, DateTimeKind.Utc); // 12:00:15.5
        schedule.GetNextOccurrence(after).Should().Be(Utc(2026, 1, 1, 12, 0, 30));
    }

    [Fact]
    public void DateTimeOffset_overload_returns_utc()
    {
        var schedule = CronSchedule.Parse("0 0 8 * * 5");
        var next = schedule.GetNextOccurrence(new DateTimeOffset(2026, 5, 26, 9, 0, 0, TimeSpan.Zero));
        next.Offset.Should().Be(TimeSpan.Zero);
        next.DayOfWeek.Should().Be(DayOfWeek.Friday);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not a cron")]
    [InlineData("* * *")]              // too few fields
    [InlineData("* * * * * * *")]      // too many fields
    [InlineData("60 * * * *")]         // minute out of range
    [InlineData("* 24 * * *")]         // hour out of range
    [InlineData("* * 32 * *")]         // day-of-month out of range
    [InlineData("* * * 13 *")]         // month out of range
    [InlineData("* * * * 8")]          // day-of-week out of range
    [InlineData("*/0 * * * *")]        // zero step
    [InlineData("5-1 * * * *")]        // inverted range
    public void Invalid_expressions_are_rejected(string expression)
    {
        CronSchedule.TryParse(expression, out _).Should().BeFalse();
        Assert.Throws<FormatException>(() => CronSchedule.Parse(expression));
    }
}
