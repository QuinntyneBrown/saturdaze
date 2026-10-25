// Acceptance Test
// Traces to: L2-200 AC1, AC2, AC3, L2-201 AC1, AC2, AC3, AC4, L2-193 AC1, AC2, AC3, L2-192 AC5, L2-192
// Description: The planner honours hours, seasons, daylight and event times, plans events, and drives to located commitments.

using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.ValueObjects;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Planning;

public class CandidatesAndTravelTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;

    private static readonly object TwoParentsTwoKids = new[]
    {
        new { Name = "Dad", Age = 45 }, new { Name = "Mom", Age = 43 },
        new { Name = "Ava", Age = 10 }, new { Name = "Mia", Age = 6 },
    };

    /// <summary>Every seeded indoor category and the outdoor flag: only the test's own places remain.</summary>
    private static readonly string[] AllButTheTestsOwn = { "Outdoor", "Museum", "Theatre", "Library", "Indoor Fun" };

    public CandidatesAndTravelTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = FakeWeatherClient.Sunny;
        _factory.Geocoder.Add("2091 Hurontario St, Mississauga L5A 4E6", 43.5711m, -79.6024m);
        _factory.Geocoder.Add("5980 McLaughlin Rd, Mississauga", 43.6082m, -79.6930m);
    }

    private static GeoLocation Near => new() { Latitude = 43.58m, Longitude = -79.62m, Address = "Mississauga" };

    public async Task InitializeAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (db.Activities.Any(a => a.Name == "Lakeside Gallery")) return;

        db.Activities.AddRange(
            new Activity
            {
                Id = Guid.NewGuid(), Name = "Lakeside Gallery", Category = "Gallery", Indoor = true, MinAge = 0, MaxAge = 99,
                DriveMinutes = 10, TypicalDurationMinutes = 120, Description = "Rotating exhibits.", MapUrl = "https://example.com/g",
                OpensAt = new TimeOnly(10, 0), ClosesAt = new TimeOnly(17, 0), Geo = Near,
            },
            new Activity
            {
                Id = Guid.NewGuid(), Name = "Berry Patch", Category = "Berries", Indoor = false, MinAge = 0, MaxAge = 99,
                DriveMinutes = 15, TypicalDurationMinutes = 90, Description = "Pick your own.", MapUrl = "https://example.com/b",
                SeasonStartMonth = 6, SeasonEndMonth = 8, Geo = Near,
            });
        db.LocalEvents.AddRange(
            new LocalEvent
            {
                Id = Guid.NewGuid(), Name = "Royal Agricultural Winter Fair", StartsOn = new DateOnly(2026, 11, 6), EndsOn = new DateOnly(2026, 11, 15),
                StartTime = new TimeOnly(9, 0), EndTime = new TimeOnly(21, 0), Indoor = true, Location = "Exhibition Place",
                DriveMinutes = 26, Url = "https://royalfair.org", Category = "Fair", Geo = Near,
            },
            new LocalEvent
            {
                Id = Guid.NewGuid(), Name = "Lantern Walk", StartsOn = new DateOnly(2026, 10, 31), EndsOn = new DateOnly(2026, 10, 31),
                StartTime = new TimeOnly(18, 0), EndTime = new TimeOnly(20, 0), Indoor = false, Location = "Kariya Park",
                DriveMinutes = 12, Url = "https://example.com/lanterns", Category = "Community", Geo = Near,
            },
            new LocalEvent
            {
                Id = Guid.NewGuid(), Name = "Lunchtime Recital", StartsOn = new DateOnly(2026, 10, 31), EndsOn = new DateOnly(2026, 11, 1),
                StartTime = new TimeOnly(12, 15), EndTime = new TimeOnly(13, 0), Indoor = true, Location = "Living Arts Centre",
                DriveMinutes = 10, Url = "https://example.com/recital", Category = "Music", Geo = Near,
            });
        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<Guid> PlaceId(string name)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return db.Activities.Where(a => a.Name == name).Select(a => a.Id).FirstOrDefault() is { } id && id != Guid.Empty
            ? id
            : db.LocalEvents.Single(e => e.Name == name).Id;
    }

    private static IEnumerable<JsonElement> Refs(JsonElement weekend, Guid id) =>
        Plans.Blocks(weekend).Where(b => Plans.RefId(b) == id);

    // ─── L2-200 ───────────────────────────────────────────────────────────

    [Fact]
    public async Task An_activity_is_planned_only_inside_its_opening_hours()
    {
        // Traces to: L2-200 AC1
        var session = await FamilyProfiles.CreateAsync(_factory, new
        {
            Members = TwoParentsTwoKids,
            Preferences = FamilyProfiles.Dislikes(AllButTheTestsOwn.Append("Berries").ToArray()),
        });
        var gallery = await PlaceId("Lakeside Gallery");

        var weekend = await Plans.PlanAsync(session.Client, "2026-09-12");

        var visits = Refs(weekend, gallery).ToList();
        visits.Should().NotBeEmpty("the gallery is the only place left to plan");
        visits.Should().OnlyContain(b => Plans.Start(b) >= new TimeOnly(10, 0) && Plans.End(b) <= new TimeOnly(17, 0));
    }

    [Fact]
    public async Task An_out_of_season_activity_is_not_planned_even_when_liked()
    {
        // Traces to: L2-200 AC2
        var session = await FamilyProfiles.CreateAsync(_factory, new
        {
            Members = TwoParentsTwoKids,
            Preferences = new[] { new { Kind = "Like", Value = "Berries" } },
        });
        var berries = await PlaceId("Berry Patch");

        var weekend = await Plans.PlanAsync(session.Client, "2026-10-31");

        Refs(weekend, berries).Should().BeEmpty();
    }

    [Fact]
    public async Task An_outdoor_outing_is_back_before_sunset_in_november()
    {
        // Traces to: L2-200 AC3
        var session = await FamilyProfiles.CreateAsync(_factory, new
        {
            Members = TwoParentsTwoKids,
            Commitments = new[] { new { Title = "Tournament", DayOfWeek = "Saturday", StartTime = "11:00", EndTime = "15:30" } },
        });

        var weekend = await Plans.PlanAsync(session.Client, "2026-11-07");

        var outdoorNames = new[] { "Port Credit Memorial Park", "Jack Darling Memorial Park", "Riverwood Conservancy", "Square One Skating Rink" };
        var late = Plans.OfKind(weekend, "Activity", "Saturday").Where(b => outdoorNames.Contains(Plans.Title(b))).ToList();
        late.Should().OnlyContain(b => Plans.End(b) <= new TimeOnly(17, 5));
    }

    // ─── L2-201 ───────────────────────────────────────────────────────────

    [Fact]
    public async Task A_weekend_only_event_is_planned_on_a_rainy_saturday()
    {
        // Traces to: L2-201 AC1
        _factory.Weather.Producer = FakeWeatherClient.Rainy;
        var session = await FamilyProfiles.CreateAsync(_factory, new { Members = TwoParentsTwoKids });
        var fair = await PlaceId("Royal Agricultural Winter Fair");

        var weekend = await Plans.PlanAsync(session.Client, "2026-11-07");

        var visit = Plans.Blocks(weekend, "Saturday").Single(b => Plans.RefId(b) == fair);
        Plans.Kind(visit).Should().Be("Activity");
        Plans.Reason(visit).Should().StartWith("on this weekend only");
    }

    [Fact]
    public async Task A_timed_evening_event_is_planned_at_its_time_never_in_the_morning()
    {
        // Traces to: L2-201 AC2
        var session = await FamilyProfiles.CreateAsync(_factory, new { Members = TwoParentsTwoKids, OutingsPerDay = 3 });
        var lanterns = await PlaceId("Lantern Walk");

        var weekend = await Plans.PlanAsync(session.Client, "2026-10-31");

        var visits = Refs(weekend, lanterns).Where(b => Plans.Kind(b) == "Activity").ToList();
        visits.Should().ContainSingle();
        Plans.Start(visits[0]).Should().BeOnOrAfter(new TimeOnly(18, 0));
        Plans.End(visits[0]).Should().BeOnOrBefore(new TimeOnly(20, 0));
    }

    [Fact]
    public async Task An_event_with_less_than_an_hour_in_any_gap_is_not_planned()
    {
        // Traces to: L2-201 AC3
        var session = await FamilyProfiles.CreateAsync(_factory, new { Members = TwoParentsTwoKids, OutingsPerDay = 3 });
        var recital = await PlaceId("Lunchtime Recital");

        var weekend = await Plans.PlanAsync(session.Client, "2026-10-31");

        Refs(weekend, recital).Should().BeEmpty();
    }

    [Fact]
    public async Task A_pending_event_submission_is_never_planned()
    {
        // Traces to: L2-201 AC4
        var session = await FamilyProfiles.CreateAsync(_factory, new { Members = TwoParentsTwoKids, OutingsPerDay = 3 });
        var title = $"Neighbourhood Fair {Guid.NewGuid():N}";
        (await session.Client.PostAsJsonAsync("/api/events/submissions",
            new { Title = title, StartsAtLocal = new DateTime(2026, 11, 14, 10, 0, 0), Category = "Fair" })).EnsureSuccessStatusCode();

        var weekend = await Plans.PlanAsync(session.Client, "2026-11-14");

        Plans.Blocks(weekend).Should().NotContain(b => Plans.Title(b) == title);
    }

    // ─── L2-193, L2-192 ───────────────────────────────────────────────────

    private async Task<(SignedInClient.Session Session, Dictionary<string, Guid> Ids)> PersonaAsync()
    {
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var family = await FamilyProfiles.SaveAsync(session.Client, new
        {
            HomeLocation = "2091 Hurontario St, Mississauga L5A 4E6",
            Members = TwoParentsTwoKids,
        });
        var ids = family.GetProperty("members").EnumerateArray()
            .ToDictionary(m => m.GetProperty("name").GetString()!, m => m.GetProperty("id").GetGuid());
        return (session, ids);
    }

    [Fact]
    public async Task The_plan_drives_to_heartland_before_the_swims_and_home_after()
    {
        // Traces to: L2-193 AC1, AC3
        var (session, ids) = await PersonaAsync();
        await FamilyProfiles.SaveAsync(session.Client, new
        {
            Commitments = new[]
            {
                new { Title = "Swim — Mia", DayOfWeek = "Sunday", StartTime = "16:20", EndTime = "16:50", AttendeeMemberIds = new[] { ids["Mia"] }, Location = new { Address = "5980 McLaughlin Rd, Mississauga" } },
                new { Title = "Swim — Ava", DayOfWeek = "Sunday", StartTime = "17:00", EndTime = "17:30", AttendeeMemberIds = new[] { ids["Ava"] }, Location = new { Address = "5980 McLaughlin Rd, Mississauga" } },
            },
        });

        var weekend = await Plans.PlanAsync(session.Client, "2026-11-07");

        var sunday = Plans.Blocks(weekend, "Sunday");
        var there = sunday.Single(b => Plans.Kind(b) == "Drive" && Plans.Title(b) == "Drive to Swim — Mia");
        Plans.End(there).Should().Be(new TimeOnly(16, 20));
        (Plans.End(there) - Plans.Start(there)).TotalMinutes.Should().BeInRange(11, 15);
        var back = sunday.Single(b => Plans.Kind(b) == "Drive" && Plans.Title(b) == "Drive home from Swim — Ava");
        Plans.Start(back).Should().Be(new TimeOnly(17, 30));
        sunday.Should().NotContain(b => Plans.Kind(b) == "Drive" && Plans.Start(b) >= new TimeOnly(16, 50) && Plans.End(b) <= new TimeOnly(17, 0));
        foreach (var day in new[] { "Saturday", "Sunday" })
        {
            var blocks = Plans.Blocks(weekend, day);
            foreach (var drive in blocks.Where(b => Plans.Kind(b) == "Drive"))
                blocks.Where(b => b.GetProperty("id").GetGuid() != drive.GetProperty("id").GetGuid())
                    .Should().NotContain(b => Plans.Start(b) < Plans.End(drive) && Plans.Start(drive) < Plans.End(b), "nothing overlaps a drive");
        }
    }

    [Fact]
    public async Task A_commitment_without_a_place_gets_no_drive()
    {
        // Traces to: L2-193 AC2
        var (session, _) = await PersonaAsync();
        await FamilyProfiles.SaveAsync(session.Client, new
        {
            Commitments = new[] { new { Title = "Piano", DayOfWeek = "Saturday", StartTime = "10:00", EndTime = "11:00" } },
        });

        var weekend = await Plans.PlanAsync(session.Client, "2026-11-14");

        Plans.Blocks(weekend).Should().NotContain(b => Plans.Kind(b) == "Drive" && Plans.Title(b).Contains("Piano"));
    }

    [Fact]
    public async Task Overlapping_swims_for_different_children_block_the_whole_span()
    {
        // Traces to: L2-192 AC5
        var (session, ids) = await PersonaAsync();
        await FamilyProfiles.SaveAsync(session.Client, new
        {
            Commitments = new[]
            {
                new { Title = "Swim — Mia", DayOfWeek = "Sunday", StartTime = "16:20", EndTime = "16:50", AttendeeMemberIds = new[] { ids["Mia"] } },
                new { Title = "Swim — Ava", DayOfWeek = "Sunday", StartTime = "16:30", EndTime = "17:00", AttendeeMemberIds = new[] { ids["Ava"] } },
            },
        });

        var weekend = await Plans.PlanAsync(session.Client, "2026-11-21");

        Plans.Blocks(weekend, "Sunday")
            .Where(b => Plans.Kind(b) is "Activity" or "Meal" or "Errand")
            .Should().NotContain(b => Plans.Start(b) < new TimeOnly(17, 0) && new TimeOnly(16, 20) < Plans.End(b));
        Plans.OfKind(weekend, "Commitment", "Sunday").Should().HaveCount(2);
    }

    [Fact]
    public async Task A_commitment_block_names_who_goes()
    {
        // Traces to: L2-192 ("The weekend page shall show the attendees under a commitment block")
        var (session, ids) = await PersonaAsync();
        await FamilyProfiles.SaveAsync(session.Client, new
        {
            Commitments = new object[]
            {
                new { Title = "Swim", DayOfWeek = "Sunday", StartTime = "16:20", EndTime = "16:50", AttendeeMemberIds = new[] { ids["Mia"], ids["Ava"] } },
                new { Title = "Church", DayOfWeek = "Sunday", StartTime = "10:00", EndTime = "11:00" },
            },
        });

        var weekend = await Plans.PlanAsync(session.Client, "2026-11-21");

        var reasons = Plans.OfKind(weekend, "Commitment", "Sunday")
            .ToDictionary(b => b.GetProperty("title").GetString()!, b => b.GetProperty("reason").GetString());
        reasons["Swim"].Should().Be("Ava, Mia");
        reasons["Church"].Should().Be("fixed commitment");
    }
}
