// Acceptance Test
// Traces to: L2-225 AC7
// Description: A past weekend's history entry carries its date.

using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.Dates;

public class PastDateTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public PastDateTests(SaturdazeApiFactory factory) => _factory = factory;

    [Fact]
    public async Task A_past_weekend_lists_its_date()
    {
        // Traces to: L2-225 AC7
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var date = await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });
        _factory.Clock.Today = new DateOnly(2026, 5, 27);

        var history = await Plans.ReadAsync(await session.Client.GetAsync("/api/weekends/history"));

        var weekend = history.EnumerateArray().Single(w => w.GetProperty("id").GetGuid() == weekendId);
        var past = weekend.GetProperty("dates").EnumerateArray().Should().ContainSingle().Subject;
        past.GetProperty("day").GetString().Should().Be("Sunday");
        past.GetProperty("meal").GetString().Should().Be("Dinner");
        past.GetProperty("restaurant").GetString().Should().Be(DatePlans.RestaurantName(date));
        past.GetProperty("attendees").EnumerateArray().Select(a => a.GetString()).Should().Equal("Ada", "Ben");
    }
}
