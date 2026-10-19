// Acceptance Test
// Traces to: L2-146 AC1
// Description: Events can be filtered to indoor or outdoor.

using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Catalog;

public class EventSettingTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private HttpClient _client = null!;
    private readonly string _suffix = Guid.NewGuid().ToString("N")[..8];
    private string IndoorName => $"Indoor symphony {_suffix}";
    private string OutdoorName => $"Outdoor market {_suffix}";

    public EventSettingTests(SaturdazeApiFactory factory) => _factory = factory;

    public async Task InitializeAsync()
    {
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.LocalEvents.AddRange(
                Event(IndoorName, indoor: true),
                Event(OutdoorName, indoor: false));
            await db.SaveChangesAsync();
        }
        _client = (await SignedInClient.CreateAsync(_factory)).Client;
    }

    public Task DisposeAsync() => Task.CompletedTask;

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task The_indoor_filter_returns_only_events_in_that_setting(bool indoor)
    {
        var response = await _client.GetAsync(
            $"/api/events?weekendOf=2026-05-16&indoor={indoor.ToString().ToLowerInvariant()}");
        var body = await response.Content.ReadAsStringAsync();
        response.IsSuccessStatusCode.Should().BeTrue(body);
        var events = JsonDocument.Parse(body).RootElement.EnumerateArray().ToList();

        events.Should().NotBeEmpty();
        events.Should().OnlyContain(e => e.GetProperty("indoor").ValueKind == (indoor ? JsonValueKind.True : JsonValueKind.False));
        events.Select(e => e.GetProperty("name").GetString())
            .Should().Contain(indoor ? IndoorName : OutdoorName);
    }

    private static LocalEvent Event(string name, bool indoor) => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        StartsOn = new DateOnly(2026, 5, 16),
        EndsOn = new DateOnly(2026, 5, 16),
        Location = "Port Credit",
        DriveMinutes = 5,
        Url = "https://example.com",
        Category = "Local",
        Indoor = indoor,
    };
}
