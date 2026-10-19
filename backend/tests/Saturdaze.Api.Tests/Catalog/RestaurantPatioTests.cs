// Acceptance Test
// Traces to: L2-147 AC1
// Description: Restaurant picks can be narrowed to places with a patio.

using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Catalog;

public class RestaurantPatioTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private readonly string _suffix = Guid.NewGuid().ToString("N")[..8];
    private HttpClient _client = null!;

    public RestaurantPatioTests(SaturdazeApiFactory factory) => _factory = factory;

    private string PatioName => $"Harbour patio {_suffix}";
    private string IndoorName => $"Back booth {_suffix}";

    public async Task InitializeAsync()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Restaurants.AddRange(Restaurant(PatioName, hasPatio: true), Restaurant(IndoorName, hasPatio: false));
            await db.SaveChangesAsync();
        }
        _client = (await SignedInClient.CreateAsync(_factory)).Client;
    }

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Patio_only_returns_only_picks_with_a_patio()
    {
        var response = await _client.GetAsync(
            "/api/restaurants?day=2026-05-16&slot=Lunch&wifeApprovedOnly=false&patioOnly=true&take=100");
        var body = await response.Content.ReadAsStringAsync();
        response.IsSuccessStatusCode.Should().BeTrue(body);
        var picks = JsonDocument.Parse(body).RootElement.EnumerateArray().ToList();

        picks.Should().NotBeEmpty();
        picks.Should().OnlyContain(p => p.GetProperty("hasPatio").GetBoolean());
        picks.Select(p => p.GetProperty("name").GetString()).Should().Contain(PatioName).And.NotContain(IndoorName);
    }

    private static Restaurant Restaurant(string name, bool hasPatio) => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        Style = "Cafe",
        Slot = MealSlot.Lunch,
        WifeApproved = true,
        DriveMinutes = 5,
        Notes = "",
        HasPatio = hasPatio,
    };
}
