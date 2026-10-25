// Acceptance Test
// Traces to: L2-198 AC2, AC3, L2-194 AC1, AC2, AC3, AC4
// Description: Catalog places carry hours, seasons, times and themes, and a family's excluded themes hide them everywhere.

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.ValueObjects;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Catalog;

public class CatalogFactsAndThemesTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;

    /// <summary>The Halloween weekend of the evaluation (docs/schedule-generation-evaluation.md).</summary>
    private const string Halloween = "2026-10-31";

    public CatalogFactsAndThemesTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = FakeWeatherClient.Rainy;
    }

    public async Task InitializeAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (db.LocalEvents.Any(e => e.Name == "Park your Pumpkin")) return;

        LocalEvent Event(string name, string category, TimeOnly? start = null, TimeOnly? end = null, bool indoor = false,
            DateOnly? endsOn = null) => new()
        {
            Id = Guid.NewGuid(), Name = name, StartsOn = new DateOnly(2026, 10, 31), EndsOn = endsOn ?? new DateOnly(2026, 11, 1),
            Location = "Mississauga", DriveMinutes = 15, Url = $"https://example.com/{Guid.NewGuid():N}", Category = category,
            Indoor = indoor, StartTime = start, EndTime = end,
            Geo = new GeoLocation { Latitude = 43.58m, Longitude = -79.62m, Address = "Mississauga" },
        };
        db.LocalEvents.AddRange(
            Event("Halloween in the Village", "Festival", new TimeOnly(11, 0), new TimeOnly(16, 0)),
            Event("Park your Pumpkin", "Community", new TimeOnly(18, 0), new TimeOnly(20, 0)),
            Event("TSO Symphony Spooktacular", "Music", new TimeOnly(14, 0), new TimeOnly(15, 30), indoor: true),
            Event("Happily Ever Haunts", "Theatre", new TimeOnly(13, 0), new TimeOnly(16, 0), indoor: true),
            Event("Sunday Antique Market", "Market", new TimeOnly(10, 0), new TimeOnly(15, 0), indoor: true));
        db.Activities.Add(new Activity
        {
            Id = Guid.NewGuid(), Name = "Summer Berry Farm", Category = "Farm", Indoor = false, MinAge = 0, MaxAge = 99,
            DriveMinutes = 20, TypicalDurationMinutes = 120, Description = "Pick your own berries.", MapUrl = "https://example.com/berries",
            OpensAt = new TimeOnly(10, 0), ClosesAt = new TimeOnly(17, 0), SeasonStartMonth = 5, SeasonEndMonth = 9,
            PriceTier = 1, SourceUrl = "https://example.com/berries",
            Geo = new GeoLocation { Latitude = 43.60m, Longitude = -79.70m, Address = "Mississauga" },
        });
        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    private static async Task<List<JsonElement>> Events(HttpClient client) =>
        (await Plans.ReadAsync(await client.GetAsync($"/api/events?weekendOf={Halloween}"))).EnumerateArray().ToList();

    private static string Name(JsonElement e) => e.GetProperty("name").GetString()!;

    [Fact]
    public async Task An_activity_carries_its_hours_season_price_and_source()
    {
        // Traces to: L2-198 AC2
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var farm = (await Plans.ReadAsync(await session.Client.GetAsync("/api/activities?take=100")))
            .EnumerateArray().Single(a => Name(a) == "Summer Berry Farm");

        farm.GetProperty("opensAt").GetString().Should().Be("10:00:00");
        farm.GetProperty("closesAt").GetString().Should().Be("17:00:00");
        farm.GetProperty("seasonStartMonth").GetInt32().Should().Be(5);
        farm.GetProperty("seasonEndMonth").GetInt32().Should().Be(9);
        farm.GetProperty("priceTier").GetInt32().Should().Be(1);
        farm.GetProperty("sourceUrl").GetString().Should().Be("https://example.com/berries");
    }

    [Fact]
    public async Task An_event_carries_its_times_and_themes()
    {
        // Traces to: L2-198 AC3, L2-194 AC4
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var pumpkin = (await Events(session.Client)).Single(e => Name(e) == "Park your Pumpkin");

        pumpkin.GetProperty("startTime").GetString().Should().Be("18:00:00");
        pumpkin.GetProperty("endTime").GetString().Should().Be("20:00:00");
        pumpkin.GetProperty("themes").EnumerateArray().Select(t => t.GetString()).Should().Contain("halloween");
    }

    [Fact]
    public async Task A_family_that_does_not_celebrate_halloween_never_sees_themed_events()
    {
        // Traces to: L2-194 AC1
        var session = await FamilyProfiles.CreateAsync(_factory, new { ExcludedThemes = new[] { "halloween" } });

        var names = (await Events(session.Client)).Select(Name).ToList();

        names.Should().NotContain(new[] { "Halloween in the Village", "Park your Pumpkin", "TSO Symphony Spooktacular", "Happily Ever Haunts" });
        names.Should().Contain("Sunday Antique Market");
    }

    [Fact]
    public async Task A_family_that_does_not_celebrate_halloween_gets_no_themed_block()
    {
        // Traces to: L2-194 AC2
        var session = await FamilyProfiles.CreateAsync(_factory, new
        {
            ExcludedThemes = new[] { "halloween" },
            Members = new[] { new { Name = "Mom", Age = 43 }, new { Name = "Mia", Age = 6 } },
        });
        var themed = (await Events((await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client))
            .Where(e => e.GetProperty("themes").EnumerateArray().Any(t => t.GetString() == "halloween"))
            .Select(e => e.GetProperty("id").GetGuid()).ToHashSet();

        var weekend = await Plans.PlanAsync(session.Client, Halloween);

        Plans.Blocks(weekend).Should().NotContain(b => Plans.RefId(b) != null && themed.Contains(Plans.RefId(b)!.Value));
    }

    [Theory]
    [InlineData("preview")]
    [InlineData("add")]
    public async Task Ideas_refuse_a_themed_event_for_a_family_that_excludes_the_theme(string action)
    {
        // Traces to: L2-194 AC3
        var session = await FamilyProfiles.CreateAsync(_factory, new { ExcludedThemes = new[] { "halloween" } });
        var weekend = await Plans.PlanAsync(session.Client, Halloween);
        var pumpkin = (await Events((await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client))
            .Single(e => Name(e) == "Park your Pumpkin").GetProperty("id").GetGuid();

        var url = $"/api/weekends/{Plans.Id(weekend)}/ideas" + (action == "preview" ? "/preview" : "");
        var response = await session.Client.PostAsJsonAsync(url, new { IdeaKind = "event", IdeaId = pumpkin, Day = "Saturday" });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await response.Content.ReadAsStringAsync()).Should().Contain("excluded_theme");
    }

    [Fact]
    public async Task A_family_without_exclusions_sees_themed_events()
    {
        // Traces to: L2-194 AC4
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var names = (await Events(session.Client)).Select(Name).ToList();

        names.Should().Contain(new[] { "Halloween in the Village", "Park your Pumpkin", "TSO Symphony Spooktacular", "Happily Ever Haunts" });
    }
}
