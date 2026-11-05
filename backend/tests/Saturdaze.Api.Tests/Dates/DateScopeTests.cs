// Acceptance Test
// Traces to: L2-221 AC1-AC8
// Description: A date is for two adults of the caller's own family on this weekend or next; anything else is refused.

using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.Dates;

public class DateScopeTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public DateScopeTests(SaturdazeApiFactory factory) => _factory = factory;

    private static async Task<string> Body(HttpResponseMessage r) => await r.Content.ReadAsStringAsync();

    [Fact]
    public async Task An_unknown_meal_is_refused()
    {
        // Traces to: L2-221 AC1
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);

        var response = await DatePlans.PostAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Brunch" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await DatePlans.ListAsync(session.Client, weekendId)).GetProperty("dates").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task Attendees_must_be_two_different_people()
    {
        // Traces to: L2-221 AC2
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var ids = await DatePlans.MemberIdsAsync(session.Client);

        var one = await DatePlans.PostAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner", AttendeeMemberIds = new[] { ids["Ada"] } });
        var twice = await DatePlans.PostAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner", AttendeeMemberIds = new[] { ids["Ada"], ids["Ada"] } });

        one.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await Body(one)).Should().Contain("attendeeMemberIds");
        twice.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await Body(twice)).Should().Contain("attendeeMemberIds");
    }

    [Fact]
    public async Task A_child_cannot_go_on_a_date()
    {
        // Traces to: L2-221 AC3
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var ids = await DatePlans.MemberIdsAsync(session.Client);

        var response = await DatePlans.PostAsync(session.Client, weekendId,
            new { Day = "Sunday", Meal = "Dinner", AttendeeMemberIds = new[] { ids["Ada"], ids["Cy"] } });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var body = await Body(response);
        body.Should().Contain("attendeeMemberIds").And.Contain("18 or over");
    }

    [Fact]
    public async Task A_family_with_one_adult_is_told_a_date_needs_two()
    {
        // Traces to: L2-221 AC4
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory, new
        {
            Members = new[] { new { Name = "Solo", Age = 40 }, new { Name = "Kid", Age = 8 } },
        });

        var response = await DatePlans.PostAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await Body(response)).Should().Contain("two adults");
    }

    [Fact]
    public async Task A_member_of_another_family_is_not_found()
    {
        // Traces to: L2-221 AC5
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var (other, _) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var mine = await DatePlans.MemberIdsAsync(session.Client);
        var theirs = await DatePlans.MemberIdsAsync(other.Client);

        var response = await DatePlans.PostAsync(session.Client, weekendId,
            new { Day = "Sunday", Meal = "Dinner", AttendeeMemberIds = new[] { mine["Ada"], theirs["Ben"] } });

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Another_familys_weekend_and_date_are_not_found()
    {
        // Traces to: L2-221 AC6
        var (owner, ownerWeekend) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var date = await DatePlans.PlanAsync(owner.Client, ownerWeekend, new { Day = "Sunday", Meal = "Dinner" });
        var dateId = DatePlans.Id(date);
        var (intruder, intruderWeekend) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var c = intruder.Client;
        var path = $"/api/weekends/{ownerWeekend}/dates";

        (await c.GetAsync(path)).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await c.PostAsJsonAsync(path, new { Day = "Saturday", Meal = "Lunch" })).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await c.PutAsJsonAsync($"{path}/{dateId}", new { Day = "Saturday", Meal = "Lunch" })).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await c.PostAsync($"{path}/{dateId}/regenerate", null)).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await c.PostAsync($"{path}/{dateId}/swap-restaurant", null)).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await c.DeleteAsync($"{path}/{dateId}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        // Their date id under the intruder's own weekend is not theirs either.
        (await c.DeleteAsync($"/api/weekends/{intruderWeekend}/dates/{dateId}")).StatusCode.Should().Be(HttpStatusCode.NotFound);

        var after = (await DatePlans.ListAsync(owner.Client, ownerWeekend)).GetProperty("dates").EnumerateArray().Single();
        DatePlans.Id(after).Should().Be(dateId);
        after.GetProperty("meal").GetString().Should().Be("Dinner");
    }

    [Fact]
    public async Task A_weekend_too_far_ahead_or_already_past_is_refused()
    {
        // Traces to: L2-221 AC7
        var (session, _) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var later = Plans.Id(await Plans.PlanAsync(session.Client, "2026-05-30"));
        var next = Plans.Id(await Plans.PlanAsync(session.Client, "2026-05-23"));
        var past = Plans.Id(await Plans.PlanAsync(session.Client, "2026-05-09"));

        var tooFar = await DatePlans.PostAsync(session.Client, later, new { Day = "Sunday", Meal = "Dinner" });
        var gone = await DatePlans.PostAsync(session.Client, past, new { Day = "Sunday", Meal = "Dinner" });
        var ok = await DatePlans.PostAsync(session.Client, next, new { Day = "Sunday", Meal = "Dinner" });

        tooFar.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await Body(tooFar)).Should().Contain("weekendId");
        gone.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        ok.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Every_date_endpoint_needs_sign_in()
    {
        // Traces to: L2-221 AC8
        var anon = _factory.CreateClient();
        var path = $"/api/weekends/{Guid.NewGuid()}/dates";
        var dateId = Guid.NewGuid();

        (await anon.GetAsync(path)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await anon.PostAsJsonAsync(path, new { Day = "Sunday", Meal = "Dinner" })).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await anon.PutAsJsonAsync($"{path}/{dateId}", new { Day = "Sunday", Meal = "Dinner" })).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await anon.PostAsync($"{path}/{dateId}/swap-activity", null)).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await anon.DeleteAsync($"{path}/{dateId}/activity")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await anon.DeleteAsync($"{path}/{dateId}")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
