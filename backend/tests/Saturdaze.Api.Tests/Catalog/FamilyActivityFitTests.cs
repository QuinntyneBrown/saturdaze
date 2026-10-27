// Acceptance Test
// Traces to: L2-145 AC1, AC2, L2-214 AC5
// Description: Activity ideas for the family welcome its youngest and oldest child.

using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Catalog;

public class FamilyActivityFitTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private readonly string _suffix = Guid.NewGuid().ToString("N")[..8];

    public FamilyActivityFitTests(SaturdazeApiFactory factory) => _factory = factory;

    private string SixUp => $"Climbing gym {_suffix}";
    private string UpToEight => $"Toddler gym {_suffix}";
    private string FourUp => $"Science centre {_suffix}";

    public async Task InitializeAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Activities.AddRange(
            Activity(SixUp, minAge: 6, maxAge: 99),
            Activity(UpToEight, minAge: 0, maxAge: 8),
            Activity(FourUp, minAge: 4, maxAge: 99));
        await db.SaveChangesAsync();
    }

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Ideas_for_a_family_leave_out_activities_that_miss_a_child()
    {
        var client = await FamilyWith(("Quinn", 41), ("Eli", 9), ("Mae", 5));

        var names = await Names(client, "/api/activities?forFamily=true&take=100");

        names.Should().NotContain(SixUp).And.NotContain(UpToEight).And.Contain(FourUp);
    }

    [Fact]
    public async Task A_family_without_children_sees_the_whole_catalogue()
    {
        var client = await FamilyWith(("Quinn", 41), ("Sara", 39));

        (await Names(client, "/api/activities?forFamily=true&take=100"))
            .Should().BeEquivalentTo(await Names(client, "/api/activities?take=100"));
    }

    [Fact]
    public async Task The_owners_own_row_counts_like_any_member()
    {
        // The owner's member is an ordinary member, so their age shapes the
        // picks too (L2-214 AC5). A five-year-old owner keeps it observable.
        var anonymous = _factory.CreateClient();
        var register = await anonymous.PostAsJsonAsync("/api/auth/register", new
        {
            Email = $"owner-{_suffix}@example.com",
            Password = "Passw0rd!",
            OwnerName = "Mae",
            OwnerAge = 5,
        });
        var body = await register.Content.ReadAsStringAsync();
        register.IsSuccessStatusCode.Should().BeTrue(body);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer",
            JsonDocument.Parse(body).RootElement.GetProperty("token").GetProperty("accessToken").GetString());

        var names = await Names(client, "/api/activities?forFamily=true&take=100");

        names.Should().NotContain(SixUp).And.Contain(UpToEight).And.Contain(FourUp);
    }

    private async Task<HttpClient> FamilyWith(params (string Name, int Age)[] members)
    {
        var client = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        var saved = await client.PutAsJsonAsync("/api/family",
            new { Members = members.Select(m => new { m.Name, m.Age }).ToArray() });
        saved.IsSuccessStatusCode.Should().BeTrue(await saved.Content.ReadAsStringAsync());
        return client;
    }

    private static async Task<List<string>> Names(HttpClient client, string url)
    {
        var response = await client.GetAsync(url);
        var body = await response.Content.ReadAsStringAsync();
        response.IsSuccessStatusCode.Should().BeTrue(body);
        return JsonDocument.Parse(body).RootElement.EnumerateArray()
            .Select(a => a.GetProperty("name").GetString()!)
            .ToList();
    }

    private static Activity Activity(string name, int minAge, int maxAge) => new()
    {
        Id = Guid.NewGuid(),
        Name = name,
        Category = "Outing",
        Description = "",
        MapUrl = "https://maps.example.com",
        DriveMinutes = 5,
        TypicalDurationMinutes = 90,
        MinAge = minAge,
        MaxAge = maxAge,
        WeatherTags = new List<string> { "sunny" },
    };
}
