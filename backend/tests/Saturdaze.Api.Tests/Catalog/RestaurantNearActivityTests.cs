// Acceptance Test
// Traces to: L2-019 AC3
// Description: Picks near an activity rank by distance from it, not by matching drive times from home.

using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Domain.ValueObjects;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Catalog;

public class RestaurantNearActivityTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private readonly string _suffix = Guid.NewGuid().ToString("N")[..8];
    private readonly Guid _activityId = Guid.NewGuid();
    private HttpClient _client = null!;

    public RestaurantNearActivityTests(SaturdazeApiFactory factory) => _factory = factory;

    private string NextDoor => $"Next door {_suffix}";
    private string AcrossTown => $"Across town {_suffix}";

    public async Task InitializeAsync()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Activities.Add(new Activity
            {
                Id = _activityId,
                Name = $"Lavender farm {_suffix}",
                Category = "Farm",
                Description = "",
                MapUrl = "https://maps.example.com",
                DriveMinutes = 30,
                TypicalDurationMinutes = 120,
                MinAge = 0,
                MaxAge = 99,
                WeatherTags = new List<string> { "sunny" },
                Geo = Geo(43.5000m, -79.9000m),
            });
            // Next door is 0.1 km from the farm but 40 minutes from home; across town is
            // 30 minutes from home like the farm, yet nowhere near it.
            db.Restaurants.AddRange(
                Restaurant(NextDoor, drive: 40, Geo(43.5008m, -79.9008m)),
                Restaurant(AcrossTown, drive: 30, Geo(43.7000m, -79.4000m)));
            await db.SaveChangesAsync();
        }
        _client = (await SignedInClient.CreateAsync(_factory)).Client;
    }

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task The_pick_next_to_the_activity_ranks_above_one_across_town()
    {
        var response = await _client.GetAsync(
            $"/api/restaurants?day=2026-05-16&slot=Lunch&wifeApprovedOnly=false&take=100&nearActivityId={_activityId}");
        var body = await response.Content.ReadAsStringAsync();
        response.IsSuccessStatusCode.Should().BeTrue(body);
        var names = JsonDocument.Parse(body).RootElement.EnumerateArray()
            .Select(r => r.GetProperty("name").GetString())
            .ToList();

        names.IndexOf(NextDoor).Should().BeLessThan(names.IndexOf(AcrossTown));
        names.IndexOf(AcrossTown).Should().BeGreaterThan(-1);
    }

    private static GeoLocation Geo(decimal lat, decimal lon) => new() { Latitude = lat, Longitude = lon };

    private static Restaurant Restaurant(string name, int drive, GeoLocation geo) => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        Style = "Cafe",
        Slot = MealSlot.Lunch,
        WifeApproved = true,
        DriveMinutes = drive,
        Notes = "",
        Geo = geo,
    };
}
