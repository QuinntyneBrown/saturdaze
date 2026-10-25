// Acceptance Test
// Traces to: L2-184 AC2, AC3, L2-187 AC2, L2-190 AC1-AC5, L2-191 AC1-AC3, L2-194 AC5, L2-195 AC1-AC4, L2-196 AC1
// Description: The planner, the lists, Ideas and the forecast keep to the family's own boundaries.

using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Travel;
using Saturdaze.Domain.ValueObjects;
using Xunit;

namespace Saturdaze.Api.Tests.Planning;

public class FamilyBoundariesPlanningTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    private static readonly object TwoParentsTwoKids = new[]
    {
        new { Name = "Ada", Age = 41 }, new { Name = "Ben", Age = 39 },
        new { Name = "Cy", Age = 9 }, new { Name = "Di", Age = 5 },
    };

    public FamilyBoundariesPlanningTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = FakeWeatherClient.Sunny;
        _factory.Geocoder.Fail = false;
        _factory.Geocoder.Delay = TimeSpan.Zero;
    }

    private static async Task<JsonElement> Activities(HttpClient client, string query = "") =>
        await Plans.ReadAsync(await client.GetAsync($"/api/activities?take=100{query}"));

    // ─── L2-190 ───────────────────────────────────────────────────────────

    [Fact]
    public async Task Saving_a_home_geocodes_it()
    {
        // Traces to: L2-190 AC1
        _factory.Geocoder.Add("2091 Hurontario St, Mississauga L5A 4E6", 43.5711m, -79.6024m);
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        await FamilyProfiles.SaveAsync(session.Client, new { HomeLocation = "2091 Hurontario St, Mississauga L5A 4E6" });

        var home = (await Plans.ReadAsync(await session.Client.GetAsync("/api/family"))).GetProperty("homeCoordinates");
        home.GetProperty("latitude").GetDecimal().Should().Be(43.5711m);
        home.GetProperty("longitude").GetDecimal().Should().Be(-79.6024m);
    }

    [Fact]
    public async Task A_geocoder_failure_saves_the_text_and_keeps_the_coordinates()
    {
        // Traces to: L2-190 AC2
        _factory.Geocoder.Add("10 Old Rd, Mississauga", 43.6m, -79.6m);
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        await FamilyProfiles.SaveAsync(session.Client, new { HomeLocation = "10 Old Rd, Mississauga" });

        _factory.Geocoder.Fail = true;
        var saved = await FamilyProfiles.SaveAsync(session.Client, new { HomeLocation = "99 Unknown Ave, Nowhere" });
        _factory.Geocoder.Fail = false;

        saved.GetProperty("homeLocation").GetString().Should().Be("99 Unknown Ave, Nowhere");
        saved.GetProperty("homeCoordinates").GetProperty("latitude").GetDecimal().Should().Be(43.6m);
    }

    private T Db<T>(Func<Saturdaze.Infrastructure.Persistence.AppDbContext, T> read)
    {
        using var scope = Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.CreateScope(_factory.Services);
        return read(Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService<Saturdaze.Infrastructure.Persistence.AppDbContext>(scope.ServiceProvider));
    }

    [Fact]
    public async Task Drive_times_start_from_each_familys_own_home()
    {
        // Traces to: L2-190 AC3
        _factory.Geocoder.Add("Port Credit, Mississauga", 43.5547m, -79.5816m);
        _factory.Geocoder.Add("Milton, Ontario", 43.5183m, -79.8774m);
        var near = await FamilyProfiles.CreateAsync(_factory, new { HomeLocation = "Port Credit, Mississauga" });
        var far = await FamilyProfiles.CreateAsync(_factory, new { HomeLocation = "Milton, Ontario" });

        var fromNear = (await Activities(near.Client)).EnumerateArray().Single(a => a.GetProperty("name").GetString() == "Port Credit Memorial Park");
        var fromFar = (await Activities(far.Client)).EnumerateArray().Single(a => a.GetProperty("name").GetString() == "Port Credit Memorial Park");

        var park = fromNear.GetProperty("location");
        var place = new GeoLocation { Latitude = park.GetProperty("latitude").GetDecimal(), Longitude = park.GetProperty("longitude").GetDecimal() };
        int Estimate(decimal lat, decimal lng) =>
            TravelEstimator.Minutes(TravelEstimator.DistanceKm(new GeoLocation { Latitude = lat, Longitude = lng }, place));
        // The stored drive was measured from the catalog's home (Port Credit, as configured for the tests):
        // a family there keeps it, and another family's differs by the estimated difference.
        var stored = Db(db => db.Activities.Single(a => a.Name == "Port Credit Memorial Park").DriveMinutes);
        fromNear.GetProperty("driveMinutes").GetInt32().Should().Be(stored);
        fromFar.GetProperty("driveMinutes").GetInt32().Should().Be(
            Math.Max(1, stored + Estimate(43.5183m, -79.8774m) - Estimate(43.5547m, -79.5816m)));
        fromFar.GetProperty("driveMinutes").GetInt32().Should().BeGreaterThan(fromNear.GetProperty("driveMinutes").GetInt32());
    }

    [Fact]
    public async Task The_forecast_is_for_the_familys_home()
    {
        // Traces to: L2-190 AC4
        _factory.Geocoder.Add("Barrie, Ontario", 44.3894m, -79.6903m);
        var session = await FamilyProfiles.CreateAsync(_factory, new { HomeLocation = "Barrie, Ontario" });

        await Plans.ReadAsync(await session.Client.GetAsync("/api/weather?weekendOf=2026-11-07"));

        _factory.Weather.Requests.Should().Contain((44.3894, -79.6903));
    }

    [Fact]
    public async Task A_slow_geocoder_never_holds_a_save_past_its_budget()
    {
        // Traces to: L2-190 AC5
        _factory.Geocoder.Delay = TimeSpan.FromSeconds(20);
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var watch = Stopwatch.StartNew();
        var response = await session.Client.PutAsJsonAsync("/api/family", new { HomeLocation = "1 Slow Lane, Toronto" });
        watch.Stop();
        _factory.Geocoder.Delay = TimeSpan.Zero;

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        watch.Elapsed.Should().BeLessThan(TimeSpan.FromSeconds(6));
    }

    // ─── L2-191 ───────────────────────────────────────────────────────────

    [Fact]
    public async Task The_planner_keeps_inside_the_familys_max_drive()
    {
        // Traces to: L2-191 AC1
        var session = await FamilyProfiles.CreateAsync(_factory, new { Members = TwoParentsTwoKids, MaxDriveMinutes = 15 });
        var reachable = (await Activities(session.Client)).EnumerateArray().Select(a => a.GetProperty("id").GetGuid()).ToHashSet();

        var weekend = await Plans.PlanAsync(session.Client, "2026-06-27");

        Plans.OfKind(weekend, "Activity").Should().NotBeEmpty()
            .And.OnlyContain(b => reachable.Contains(Plans.RefId(b)!.Value));
    }

    [Fact]
    public async Task Lists_use_the_familys_max_drive_and_never_go_past_it()
    {
        // Traces to: L2-191 AC2
        var session = await FamilyProfiles.CreateAsync(_factory, new { MaxDriveMinutes = 30 });

        var activities = (await Activities(session.Client)).EnumerateArray().ToList();
        var widened = (await Activities(session.Client, "&maxDriveMinutes=200")).EnumerateArray().ToList();
        var events = (await Plans.ReadAsync(await session.Client.GetAsync("/api/events?weekendOf=2026-08-15"))).EnumerateArray().ToList();
        var eventsWidened = (await Plans.ReadAsync(await session.Client.GetAsync("/api/events?weekendOf=2026-08-15&maxDriveMinutes=200"))).EnumerateArray().ToList();

        activities.Should().NotBeEmpty().And.OnlyContain(a => a.GetProperty("driveMinutes").GetInt32() <= 30);
        widened.Should().OnlyContain(a => a.GetProperty("driveMinutes").GetInt32() <= 30);
        events.Concat(eventsWidened).Should().OnlyContain(e => e.GetProperty("driveMinutes").GetInt32() <= 30);
    }

    [Fact]
    public async Task An_idea_beyond_the_max_drive_is_refused()
    {
        // Traces to: L2-191 AC3
        var session = await FamilyProfiles.CreateAsync(_factory, new { MaxDriveMinutes = 45 });
        var weekend = await Plans.PlanAsync(session.Client, "2026-07-04");
        var all = await Plans.ReadAsync(await (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client.GetAsync("/api/activities?take=100"));
        var zoo = all.EnumerateArray().Single(a => a.GetProperty("name").GetString() == "Toronto Zoo").GetProperty("id").GetGuid();

        var response = await session.Client.PostAsJsonAsync($"/api/weekends/{Plans.Id(weekend)}/ideas",
            new { IdeaKind = "activity", IdeaId = zoo, Day = "Saturday" });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await response.Content.ReadAsStringAsync()).Should().Contain("beyond_max_drive");
    }

    // ─── L2-195, L2-184 ───────────────────────────────────────────────────

    [Fact]
    public async Task The_day_starts_when_the_family_says()
    {
        // Traces to: L2-195 AC1
        var session = await FamilyProfiles.CreateAsync(_factory, new { Members = TwoParentsTwoKids, DayStart = "10:00" });

        var weekend = await Plans.PlanAsync(session.Client, "2026-07-11");

        Plans.Blocks(weekend).Should().OnlyContain(b => Plans.Start(b) >= new TimeOnly(10, 0));
    }

    [Fact]
    public async Task The_day_ends_half_an_hour_before_the_youngests_bedtime()
    {
        // Traces to: L2-195 AC2
        var session = await FamilyProfiles.CreateAsync(_factory, new { Members = TwoParentsTwoKids, YoungestBedtime = "19:30" });

        var weekend = await Plans.PlanAsync(session.Client, "2026-07-18");

        Plans.Blocks(weekend).Should().OnlyContain(b => Plans.End(b) <= new TimeOnly(19, 0));
    }

    [Fact]
    public async Task A_quiet_sunday_has_one_outing_at_most()
    {
        // Traces to: L2-195 AC3, L2-184 AC3
        var session = await FamilyProfiles.CreateAsync(_factory, new { Members = TwoParentsTwoKids, QuietSunday = true, OutingsPerDay = 3 });

        var weekend = await Plans.PlanAsync(session.Client, "2026-07-25");

        Plans.OfKind(weekend, "Activity", "Sunday").Should().HaveCountLessThanOrEqualTo(1);
        Plans.OfKind(weekend, "Activity", "Saturday").Should().HaveCountGreaterThanOrEqualTo(2).And.HaveCountLessThanOrEqualTo(3);
        foreach (var day in new[] { "Saturday", "Sunday" })
        {
            var blocks = Plans.Blocks(weekend, day).OrderBy(Plans.Start).ToList();
            for (var i = 1; i < blocks.Count; i++)
                Plans.Start(blocks[i]).Should().BeOnOrAfter(Plans.End(blocks[i - 1]), $"{day} blocks never overlap");
        }
    }

    [Fact]
    public async Task One_outing_a_day_means_exactly_one()
    {
        // Traces to: L2-184 AC2
        var session = await FamilyProfiles.CreateAsync(_factory, new { Members = TwoParentsTwoKids, OutingsPerDay = 1 });

        var weekend = await Plans.PlanAsync(session.Client, "2026-08-01");

        Plans.OfKind(weekend, "Activity", "Saturday").Should().HaveCount(1);
        Plans.OfKind(weekend, "Activity", "Sunday").Should().HaveCount(1);
    }

    [Fact]
    public async Task An_indoor_family_gets_an_indoor_outing_even_on_a_sunny_day()
    {
        // Traces to: L2-195 AC4
        var session = await FamilyProfiles.CreateAsync(_factory, new { Members = TwoParentsTwoKids, Leaning = "Indoor" });
        var indoor = (await Activities(session.Client)).EnumerateArray()
            .Where(a => a.GetProperty("indoor").GetBoolean()).Select(a => a.GetProperty("id").GetGuid()).ToHashSet();

        var weekend = await Plans.PlanAsync(session.Client, "2026-08-08");

        Plans.OfKind(weekend, "Activity", "Saturday").Should().Contain(b => indoor.Contains(Plans.RefId(b)!.Value));
    }

    [Fact]
    public async Task With_sunday_dinner_at_home_off_sunday_dinner_is_a_restaurant()
    {
        // Traces to: L2-187 AC2
        var session = await FamilyProfiles.CreateAsync(_factory, new { Members = TwoParentsTwoKids, SundayDinnerAtHome = false });

        var weekend = await Plans.PlanAsync(session.Client, "2026-08-15");

        var dinner = Plans.OfKind(weekend, "Meal", "Sunday").Single(b => Plans.Title(b).StartsWith("Dinner"));
        Plans.RefId(dinner).Should().NotBeNull();
        Plans.End(dinner).Should().BeOnOrBefore(new TimeOnly(19, 30));
    }

    // ─── L2-196, L2-194 ───────────────────────────────────────────────────

    [Fact]
    public async Task A_liked_indoor_category_beats_the_sunny_forecast()
    {
        // Traces to: L2-196 AC1
        var session = await FamilyProfiles.CreateAsync(_factory, new
        {
            Members = TwoParentsTwoKids,
            Preferences = new[] { new { Kind = "Like", Value = "Indoor Fun" } },
        });

        var weekend = await Plans.PlanAsync(session.Client, "2026-08-22");

        Plans.OfKind(weekend, "Activity", "Saturday").Should().Contain(b => Plans.Title(b) == "Rec Room Mississauga");
    }

    [Fact]
    public async Task A_dislike_of_indoor_leaves_out_every_indoor_place()
    {
        // Traces to: L2-194 AC5
        var session = await FamilyProfiles.CreateAsync(_factory, new
        {
            Members = TwoParentsTwoKids,
            Preferences = new[] { new { Kind = "Dislike", Value = "Indoor" } },
        });
        var indoor = (await Activities(session.Client)).EnumerateArray()
            .Where(a => a.GetProperty("indoor").GetBoolean()).Select(a => a.GetProperty("id").GetGuid()).ToHashSet();
        _factory.Weather.Producer = FakeWeatherClient.Rainy;

        var weekend = await Plans.PlanAsync(session.Client, "2026-08-29");

        Plans.OfKind(weekend, "Activity").Should().NotContain(b => indoor.Contains(Plans.RefId(b)!.Value));
    }
}
