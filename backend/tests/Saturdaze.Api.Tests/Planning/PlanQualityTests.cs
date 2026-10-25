// Acceptance Test
// Traces to: L2-184, L2-185, L2-186, L2-187, L2-188, L2-189
// Description: Planner defects found by docs/schedule-generation-evaluation.md, proven through the API.

using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.Planning;

public class PlanQualityTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public PlanQualityTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = FakeWeatherClient.Sunny;
    }

    [Fact]
    public async Task The_regenerate_response_lists_each_block_once_as_stored()
    {
        // Traces to: L2-188 AC1
        var session = await SignedInClient.CreateAsync(_factory);
        var weekend = await Plans.PlanAsync(session.Client, "2026-06-06");

        var regenerated = await Plans.ReadAsync(
            await session.Client.PostAsync($"/api/weekends/{Plans.Id(weekend)}/regenerate", content: null));
        var stored = await Plans.ReadAsync(await session.Client.GetAsync($"/api/weekends/{Plans.Id(weekend)}"));

        var ids = Plans.Blocks(regenerated).Select(b => b.GetProperty("id").GetGuid()).ToList();
        ids.Should().OnlyHaveUniqueItems();
        Plans.Blocks(regenerated).Select(Plans.Shape).Should().BeEquivalentTo(Plans.Blocks(stored).Select(Plans.Shape));
    }

    [Fact]
    public async Task The_regenerate_day_response_lists_each_block_once_as_stored()
    {
        // Traces to: L2-188 AC2
        var session = await SignedInClient.CreateAsync(_factory);
        var weekend = await Plans.PlanAsync(session.Client, "2026-06-13");

        var regenerated = await Plans.ReadAsync(
            await session.Client.PostAsync($"/api/weekends/{Plans.Id(weekend)}/days/Sunday/regenerate", content: null));
        var stored = await Plans.ReadAsync(await session.Client.GetAsync($"/api/weekends/{Plans.Id(weekend)}"));

        Plans.Blocks(regenerated).Select(b => b.GetProperty("id").GetGuid()).Should().OnlyHaveUniqueItems();
        Plans.Blocks(regenerated).Select(Plans.Shape).Should().BeEquivalentTo(Plans.Blocks(stored).Select(Plans.Shape));
    }

    [Fact]
    public async Task No_activity_is_planned_twice_in_one_weekend()
    {
        // Traces to: L2-185 AC1
        var session = await FamilyProfiles.CreateAsync(_factory, new
        {
            Members = new[] { new { Name = "Ada", Age = 40 }, new { Name = "Bo", Age = 8 } },
            Preferences = FamilyProfiles.Dislikes(FamilyProfiles.OnlyRecRoom),
        });

        var weekend = await Plans.PlanAsync(session.Client, "2026-06-06");

        Plans.OfKind(weekend, "Activity").Select(Plans.RefId).Should().OnlyHaveUniqueItems();
    }

    [Fact]
    public async Task A_locked_saturday_activity_is_not_planned_again_on_sunday()
    {
        // Traces to: L2-185 AC2
        var session = await FamilyProfiles.CreateAsync(_factory, new
        {
            Members = new[] { new { Name = "Ada", Age = 40 } },
            Preferences = FamilyProfiles.Dislikes(FamilyProfiles.OnlyRecRoom),
        });
        var weekend = await Plans.PlanAsync(session.Client, "2026-06-13");
        var saturdayPick = Plans.OfKind(weekend, "Activity", "Saturday").First();
        await Plans.ReadAsync(await session.Client.PutAsJsonAsync(
            $"/api/blocks/{saturdayPick.GetProperty("id").GetGuid()}/lock", new { Locked = true }));

        var regenerated = await Plans.ReadAsync(
            await session.Client.PostAsync($"/api/weekends/{Plans.Id(weekend)}/regenerate", content: null));

        Plans.OfKind(regenerated, "Activity", "Sunday").Select(Plans.RefId)
            .Should().NotContain(Plans.RefId(saturdayPick));
    }

    [Fact]
    public async Task A_swap_never_brings_in_an_activity_already_on_the_other_day()
    {
        // Traces to: L2-185 AC3
        var session = await SignedInClient.CreateAsync(_factory);
        var weekend = await Plans.PlanAsync(session.Client, "2026-06-20");
        var sunday = Plans.OfKind(weekend, "Activity", "Sunday").First();

        var swapped = await Plans.ReadAsync(await session.Client.PostAsJsonAsync(
            $"/api/blocks/{sunday.GetProperty("id").GetGuid()}/swap", new { }));

        Plans.Blocks(swapped).Select(b => b.GetProperty("id").GetGuid()).Should().OnlyHaveUniqueItems();
        var saturdayIds = Plans.OfKind(swapped, "Activity", "Saturday").Select(Plans.RefId).ToList();
        var replacement = Plans.Blocks(swapped).Single(b => b.GetProperty("id").GetGuid() == sunday.GetProperty("id").GetGuid());
        saturdayIds.Should().NotContain(Plans.RefId(replacement));
    }

    [Fact]
    public async Task An_activity_the_family_had_before_is_not_called_a_first_time()
    {
        // Traces to: L2-189 AC1
        var session = await FamilyProfiles.CreateAsync(_factory, new
        {
            TryNewEnabled = true,
            Members = new[] { new { Name = "Ada", Age = 40 } },
            Preferences = FamilyProfiles.Dislikes(FamilyProfiles.OnlyRecRoom),
        });
        var first = await Plans.PlanAsync(session.Client, "2026-06-06");
        var recRoom = Plans.OfKind(first, "Activity").Select(Plans.RefId).First();

        var later = await Plans.PlanAsync(session.Client, "2026-06-20");

        var again = Plans.OfKind(later, "Activity").Where(b => Plans.RefId(b) == recRoom).ToList();
        again.Should().NotBeEmpty("the Rec Room is the only activity left to plan");
        again.Should().OnlyContain(b => !Plans.Reason(b).Contains("first time"));
    }

    [Fact]
    public async Task A_new_activity_with_try_something_new_on_says_first_time()
    {
        // Traces to: L2-189 AC2
        var session = await FamilyProfiles.CreateAsync(_factory, new { TryNewEnabled = true });

        var weekend = await Plans.PlanAsync(session.Client, "2026-07-04");

        Plans.OfKind(weekend, "Activity").Where(b => Plans.RefId(b) is not null)
            .Should().NotBeEmpty()
            .And.OnlyContain(b => Plans.Reason(b).Contains("first time trying this — variety on"));
    }

    [Fact]
    public async Task With_try_something_new_off_no_reason_says_first_time()
    {
        // Traces to: L2-189 AC3
        var session = await FamilyProfiles.CreateAsync(_factory, new { TryNewEnabled = false });

        var weekend = await Plans.PlanAsync(session.Client, "2026-07-11");

        Plans.Blocks(weekend).Should().OnlyContain(b => !Plans.Reason(b).Contains("first time"));
    }

    private static readonly object TwoParentsTwoKids = new[]
    {
        new { Name = "Ada", Age = 41 }, new { Name = "Ben", Age = 39 },
        new { Name = "Cy", Age = 9 }, new { Name = "Di", Age = 5 },
    };

    private static object Commitment(string title, string day, string start, string end) =>
        new { Title = title, DayOfWeek = day, StartTime = start, EndTime = end };

    [Fact]
    public async Task A_free_saturday_gets_one_outing_before_lunch_and_one_after()
    {
        // Traces to: L2-184 AC1
        var session = await FamilyProfiles.CreateAsync(_factory, new { Members = TwoParentsTwoKids });

        var weekend = await Plans.PlanAsync(session.Client, "2026-06-27");

        var outings = Plans.OfKind(weekend, "Activity", "Saturday");
        var lunch = Plans.OfKind(weekend, "Meal", "Saturday").Single(b => Plans.Title(b).StartsWith("Lunch"));
        outings.Should().HaveCount(2);
        outings.Should().ContainSingle(b => Plans.End(b) <= Plans.Start(lunch));
        outings.Should().ContainSingle(b => Plans.Start(b) >= Plans.End(lunch));
    }

    [Fact]
    public async Task A_day_with_only_short_gaps_gets_no_outing_and_keeps_its_downtime()
    {
        // Traces to: L2-184 AC4
        var session = await FamilyProfiles.CreateAsync(_factory, new
        {
            Members = TwoParentsTwoKids,
            Commitments = new[]
            {
                Commitment("Tutoring", "Saturday", "09:00", "11:00"),
                Commitment("Tournament", "Saturday", "12:00", "14:30"),
                Commitment("Recital", "Saturday", "15:30", "21:00"),
            },
        });

        var weekend = await Plans.PlanAsync(session.Client, "2026-07-18");

        Plans.OfKind(weekend, "Activity", "Saturday").Should().BeEmpty();
        Plans.OfKind(weekend, "Downtime", "Saturday").Should().NotBeEmpty();
    }

    [Theory]
    [InlineData("2026-08-01")]
    [InlineData("2026-08-22")]
    [InlineData("2026-09-05")]
    public async Task Every_meal_starts_inside_its_window(string weekendOf)
    {
        // Traces to: L2-186 AC1
        var session = await SignedInClient.CreateAsync(_factory);

        var weekend = await Plans.PlanAsync(session.Client, weekendOf);

        foreach (var meal in Plans.OfKind(weekend, "Meal"))
        {
            var start = Plans.Start(meal);
            if (Plans.Title(meal).StartsWith("Lunch"))
                start.Should().BeOnOrAfter(new TimeOnly(11, 30)).And.BeOnOrBefore(new TimeOnly(13, 30), Plans.Title(meal));
            else
                start.Should().BeOnOrAfter(new TimeOnly(17, 0)).And.BeOnOrBefore(new TimeOnly(19, 0), Plans.Title(meal));
        }
    }

    [Fact]
    public async Task Lunch_after_morning_church_is_at_noon_not_before()
    {
        // Traces to: L2-186 AC2
        var session = await FamilyProfiles.CreateAsync(_factory, new
        {
            Members = TwoParentsTwoKids,
            Commitments = new[] { Commitment("Church", "Sunday", "10:00", "11:30") },
        });

        var weekend = await Plans.PlanAsync(session.Client, "2026-09-12");

        var lunch = Plans.OfKind(weekend, "Meal", "Sunday").Single(b => Plans.Title(b).StartsWith("Lunch"));
        Plans.Start(lunch).Should().Be(new TimeOnly(12, 0));
    }

    [Fact]
    public async Task A_commitment_over_the_whole_lunch_window_leaves_lunch_out()
    {
        // Traces to: L2-186 AC3
        var session = await FamilyProfiles.CreateAsync(_factory, new
        {
            Members = TwoParentsTwoKids,
            Commitments = new[] { Commitment("Tournament", "Saturday", "11:00", "14:00") },
        });

        var weekend = await Plans.PlanAsync(session.Client, "2026-09-19");

        Plans.OfKind(weekend, "Meal", "Saturday").Should().NotContain(b => Plans.Title(b).StartsWith("Lunch"));
    }

    [Fact]
    public async Task Lunch_at_grandmas_is_the_lunch()
    {
        // Traces to: L2-186 AC4
        var session = await FamilyProfiles.CreateAsync(_factory, new
        {
            Members = TwoParentsTwoKids,
            Commitments = new[] { Commitment("Lunch at Grandma's", "Sunday", "12:30", "14:00") },
        });

        var weekend = await Plans.PlanAsync(session.Client, "2026-09-26");

        Plans.OfKind(weekend, "Meal", "Sunday").Should().NotContain(b => Plans.Title(b).StartsWith("Lunch"));
    }

    [Fact]
    public async Task Lunch_is_at_the_restaurant_nearest_the_stop_before_it()
    {
        // Traces to: L2-186 AC5
        var session = await FamilyProfiles.CreateAsync(_factory, new { Members = TwoParentsTwoKids });
        var weekend = await Plans.PlanAsync(session.Client, "2026-10-03");
        var restaurants = await Plans.ReadAsync(await session.Client.GetAsync("/api/restaurants?day=2026-10-03&slot=Lunch&take=50"));

        var saturday = Plans.Blocks(weekend, "Saturday");
        var lunch = saturday.Single(b => Plans.Kind(b) == "Meal" && Plans.Title(b).StartsWith("Lunch"));
        var before = saturday.Where(b => Plans.Kind(b) == "Activity" && Plans.End(b) <= Plans.Start(lunch))
            .OrderBy(Plans.End).LastOrDefault();
        before.ValueKind.Should().Be(JsonValueKind.Object, "a morning outing comes before lunch");
        var stop = before.GetProperty("stop");
        var nearest = restaurants.EnumerateArray()
            .Where(r => r.GetProperty("location").ValueKind == JsonValueKind.Object)
            .MinBy(r => Plans.Km(stop, r.GetProperty("location")));
        Plans.RefId(lunch).Should().Be(nearest.GetProperty("id").GetGuid());
        Plans.Reason(lunch).Should().Be($"near {Plans.Title(before)}");
    }

    [Fact]
    public async Task Sunday_has_dinner_at_home_by_default()
    {
        // Traces to: L2-187 AC1
        var session = await FamilyProfiles.CreateAsync(_factory, new { Members = TwoParentsTwoKids });

        var weekend = await Plans.PlanAsync(session.Client, "2026-10-10");

        var dinner = Plans.OfKind(weekend, "Meal", "Sunday").Single(b => Plans.Title(b) == "Dinner at home");
        Plans.RefId(dinner).Should().BeNull();
        Plans.Reason(dinner).Should().Be("Sunday dinner at home");
        Plans.Start(dinner).Should().BeOnOrAfter(new TimeOnly(17, 0)).And.BeOnOrBefore(new TimeOnly(19, 0));
        Plans.End(dinner).Should().BeOnOrBefore(new TimeOnly(19, 30));
    }

    [Fact]
    public async Task A_sunday_evening_commitment_over_the_dinner_window_leaves_dinner_out()
    {
        // Traces to: L2-187 AC3
        var session = await FamilyProfiles.CreateAsync(_factory, new
        {
            Members = TwoParentsTwoKids,
            Commitments = new[] { Commitment("Choir", "Sunday", "17:00", "20:00") },
        });

        var weekend = await Plans.PlanAsync(session.Client, "2026-10-17");

        Plans.OfKind(weekend, "Meal", "Sunday").Should().NotContain(b => Plans.Title(b).StartsWith("Dinner"));
    }
}
