// Acceptance Test
// Traces to: L2-222 AC1-AC6
// Description: A date avoids the attendees' busy time, the weekend carries one locked date block and is planned around it.

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.WebUtilities;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Calendar;
using Xunit;

namespace Saturdaze.Api.Tests.Dates;

public class DateFitsWeekendTests : IClassFixture<SaturdazeApiFactory>
{
    private static readonly TimeSpan Edt = TimeSpan.FromHours(-4);
    private readonly SaturdazeApiFactory _factory;

    public DateFitsWeekendTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = FakeWeatherClient.Sunny;
        _factory.GoogleCalendar.IsConfigured = true;
        _factory.GoogleCalendar.Unavailable = false;
        _factory.GoogleCalendar.ListDelay = TimeSpan.Zero;
    }

    private async Task<JsonElement> Weekend(HttpClient client, Guid id) =>
        await Plans.ReadAsync(await client.GetAsync($"/api/weekends/{id}"));

    private static JsonElement DateBlock(JsonElement weekend, string day) =>
        Plans.OfKind(weekend, "Date", day).Should().ContainSingle().Subject;

    private static void NothingOverlaps(JsonElement weekend, JsonElement dateBlock)
    {
        var day = dateBlock.GetProperty("day").GetString()!;
        Plans.Blocks(weekend, day)
            .Where(b => b.GetProperty("id").GetGuid() != dateBlock.GetProperty("id").GetGuid())
            .Should().OnlyContain(b => Plans.End(b) <= Plans.Start(dateBlock) || Plans.Start(b) >= Plans.End(dateBlock));
    }

    private static object Commitment(string title, Guid[] attendees) => new
    {
        Commitments = new[] { new { Title = title, DayOfWeek = "Saturday", StartTime = "07:00", EndTime = "08:00", AttendeeMemberIds = attendees } },
    };

    [Fact]
    public async Task A_commitment_for_everyone_holds_the_date_back_and_one_only_for_a_child_does_not()
    {
        // Traces to: L2-222 AC1
        var (everyone, everyoneWeekend) = await DatePlans.FamilyWithWeekendAsync(_factory);
        await FamilyProfiles.SaveAsync(everyone.Client, Commitment("Family run", Array.Empty<Guid>()));
        var (childOnly, childWeekend) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var ids = await DatePlans.MemberIdsAsync(childOnly.Client);
        await FamilyProfiles.SaveAsync(childOnly.Client, Commitment("Cy's swim", new[] { ids["Cy"] }));

        var held = await DatePlans.PlanAsync(everyone.Client, everyoneWeekend, new { Day = "Saturday", Meal = "Breakfast" });
        var free = await DatePlans.PlanAsync(childOnly.Client, childWeekend, new { Day = "Saturday", Meal = "Breakfast" });

        DatePlans.Start(held).Should().BeOnOrAfter(new TimeOnly(8, 0));
        DatePlans.Start(free).Should().BeBefore(new TimeOnly(8, 0));
    }

    [Fact]
    public async Task A_calendar_event_over_the_whole_dinner_window_is_a_clash()
    {
        // Traces to: L2-222 AC2
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var email = $"cal-{Guid.NewGuid():N}@example.com";
        var authorize = await Plans.ReadAsync(await session.Client.PostAsync("/api/calendar/google/authorize", content: null));
        var state = QueryHelpers.ParseQuery(new Uri(authorize.GetProperty("authorizationUrl").GetString()!).Query)["state"].ToString();
        await Plans.ReadAsync(await session.Client.PostAsJsonAsync("/api/calendar/google/connect",
            new { Code = _factory.GoogleCalendar.IssueCode(email), State = state }));
        _factory.GoogleCalendar.AddOwnEvent(email, new GoogleCalendarEvent($"own-{Guid.NewGuid():N}", "Recital",
            new DateTimeOffset(2026, 5, 17, 17, 0, 0, Edt), new DateTimeOffset(2026, 5, 17, 21, 0, 0, Edt),
            AllDay: false, Cancelled: false, Declined: false, Free: false, WrittenBySaturdaze: false));

        var response = await DatePlans.PostAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await Plans.ReadAsync(await session.Client.GetAsync($"/api/weekends/{weekendId}/dates")))
            .GetProperty("dates").GetArrayLength().Should().Be(0);
        (await response.Content.ReadAsStringAsync()).Should().Contain("date_clash");
    }

    [Fact]
    public async Task The_weekend_has_one_locked_date_block_and_nothing_overlaps_it()
    {
        // Traces to: L2-222 AC3
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);

        var date = await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });

        var weekend = await Weekend(session.Client, weekendId);
        var block = DateBlock(weekend, "Sunday");
        Plans.Start(block).Should().Be(DatePlans.Start(date));
        Plans.End(block).Should().Be(DatePlans.End(date));
        block.GetProperty("isLocked").GetBoolean().Should().BeTrue();
        Plans.RefId(block).Should().Be(DatePlans.Id(date));
        Plans.Title(block).Should().Be($"Dinner date at {DatePlans.RestaurantName(date)}");
        NothingOverlaps(weekend, block);
    }

    [Fact]
    public async Task Children_who_stay_home_need_care_and_a_couple_alone_does_not()
    {
        // Traces to: L2-222 AC4
        var (family, familyWeekend) = await DatePlans.FamilyWithWeekendAsync(_factory);
        var (couple, coupleWeekend) = await DatePlans.FamilyWithWeekendAsync(_factory, new
        {
            Members = new[] { new { Name = "Eve", Age = 33 }, new { Name = "Finn", Age = 35 } },
        });

        var withKids = await DatePlans.PlanAsync(family.Client, familyWeekend, new { Day = "Sunday", Meal = "Dinner" });
        var alone = await DatePlans.PlanAsync(couple.Client, coupleWeekend, new { Day = "Sunday", Meal = "Dinner" });

        withKids.GetProperty("kidsNeedCare").EnumerateArray().Select(k => k.GetString()).Should().Equal("Cy", "Di");
        Plans.Reason(DateBlock(await Weekend(family.Client, familyWeekend), "Sunday")).Should().Contain("kids need care");
        alone.GetProperty("kidsNeedCare").GetArrayLength().Should().Be(0);
        Plans.Reason(DateBlock(await Weekend(couple.Client, coupleWeekend), "Sunday")).Should().NotContain("care");
    }

    [Fact]
    public async Task Regenerating_the_weekend_or_the_day_keeps_the_date_block()
    {
        // Traces to: L2-222 AC5
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Lunch" });
        var before = DateBlock(await Weekend(session.Client, weekendId), "Sunday");

        var regenerated = await Plans.ReadAsync(await session.Client.PostAsync($"/api/weekends/{weekendId}/regenerate", null));
        var afterWeekend = DateBlock(regenerated, "Sunday");
        var dayRegenerated = await Plans.ReadAsync(await session.Client.PostAsync($"/api/weekends/{weekendId}/days/sunday/regenerate", null));
        var afterDay = DateBlock(dayRegenerated, "Sunday");

        foreach (var (weekend, block) in new[] { (regenerated, afterWeekend), (dayRegenerated, afterDay) })
        {
            block.GetProperty("id").GetGuid().Should().Be(before.GetProperty("id").GetGuid());
            Plans.Shape(block).Should().Be(Plans.Shape(before));
            NothingOverlaps(weekend, block);
        }
    }

    [Fact]
    public async Task The_date_block_cannot_be_unlocked_and_unlocking_the_day_keeps_it_locked()
    {
        // Traces to: L2-222 AC6
        var (session, weekendId) = await DatePlans.FamilyWithWeekendAsync(_factory);
        await DatePlans.PlanAsync(session.Client, weekendId, new { Day = "Sunday", Meal = "Dinner" });
        var block = DateBlock(await Weekend(session.Client, weekendId), "Sunday");

        var unlock = await session.Client.PutAsJsonAsync($"/api/blocks/{block.GetProperty("id").GetGuid()}/lock", new { Locked = false });
        await Plans.ReadAsync(await session.Client.PutAsJsonAsync($"/api/weekends/{weekendId}/days/sunday/lock", new { Locked = true }));
        var dayUnlocked = await Plans.ReadAsync(await session.Client.PutAsJsonAsync($"/api/weekends/{weekendId}/days/sunday/lock", new { Locked = false }));

        unlock.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await unlock.Content.ReadAsStringAsync()).Should().Contain("date_locked");
        DateBlock(dayUnlocked, "Sunday").GetProperty("isLocked").GetBoolean().Should().BeTrue();
    }
}
