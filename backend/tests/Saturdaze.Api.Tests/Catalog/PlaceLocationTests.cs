using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Api.Tests.Catalog;

/// <summary>L2-087: every catalog place carries a location.</summary>
public class PlaceLocationTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    public PlaceLocationTests(SaturdazeApiFactory factory) => _factory = factory;

    private static void ShouldHaveLocation(JsonElement item)
    {
        var location = item.GetProperty("location");
        location.ValueKind.Should().Be(JsonValueKind.Object, item.ToString());
        location.GetProperty("latitude").GetDecimal().Should().BeInRange(-90m, 90m);
        location.GetProperty("longitude").GetDecimal().Should().BeInRange(-180m, 180m);
        location.GetProperty("address").GetString().Should().NotBeNullOrWhiteSpace();
    }

    private static async Task<JsonElement[]> GetArray(HttpClient client, string url)
    {
        var res = await client.GetAsync(url);
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        return JsonDocument.Parse(body).RootElement.EnumerateArray().ToArray();
    }

    [Fact]
    public async Task Activity_restaurant_and_event_lists_include_each_place_location()
    {
        // Traces to: L2-087 AC4
        var client = (await SignedInClient.CreateAsync(_factory)).Client;

        var activities = await GetArray(client, "/api/activities");
        activities.Should().NotBeEmpty();
        foreach (var a in activities) ShouldHaveLocation(a);

        var restaurants = await GetArray(client, "/api/restaurants?day=2026-05-16&slot=Lunch&wifeApprovedOnly=false");
        restaurants.Should().NotBeEmpty();
        foreach (var r in restaurants) ShouldHaveLocation(r);

        var events = await GetArray(client, "/api/events?weekendOf=2026-06-13");
        events.Should().NotBeEmpty();
        foreach (var e in events) ShouldHaveLocation(e);
    }

    [Fact]
    public async Task Submission_with_out_of_range_latitude_is_rejected_naming_latitude()
    {
        // Traces to: L2-087 AC2
        var client = (await SignedInClient.CreateAsync(_factory)).Client;
        var res = await client.PostAsJsonAsync("/api/events/submissions", new
        {
            Title = "Buskerfest",
            StartsAtLocal = new DateTime(2026, 6, 20, 14, 0, 0),
            Latitude = 91m,
            Longitude = -79.58m,
            Address = "Lakeshore Rd, Port Credit",
        });

        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest, body);
        JsonDocument.Parse(body).RootElement.GetProperty("errors").EnumerateObject()
            .Select(p => p.Name)
            .Should().Contain(n => string.Equals(n, "latitude", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Approval_requires_a_location_until_the_admin_supplies_one()
    {
        // Traces to: L2-087 AC3
        var submitter = await SignedInClient.CreateAsync(_factory);
        var title = $"Market-{Guid.NewGuid():N}";
        var submit = await submitter.Client.PostAsJsonAsync("/api/events/submissions", new
        {
            Title = title,
            StartsAtLocal = new DateTime(2026, 9, 12, 9, 0, 0),
            Location = "Lakeshore Rd",
        });
        submit.EnsureSuccessStatusCode();
        var id = JsonDocument.Parse(await submit.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid();

        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var refused = await admin.Client.PostAsync($"/api/events/submissions/{id}/approve", content: null);
        var refusedBody = await refused.Content.ReadAsStringAsync();
        refused.StatusCode.Should().Be(HttpStatusCode.BadRequest, refusedBody);
        JsonDocument.Parse(refusedBody).RootElement.GetProperty("code").GetString().Should().Be("location_required");

        var approved = await admin.Client.PostAsJsonAsync($"/api/events/submissions/{id}/approve", new
        {
            Latitude = 43.5512m,
            Longitude = -79.5866m,
            Address = "Lakeshore Rd E, Port Credit",
        });
        approved.StatusCode.Should().Be(HttpStatusCode.OK, await approved.Content.ReadAsStringAsync());

        var published = (await GetArray(submitter.Client, "/api/events?weekendOf=2026-09-12"))
            .Single(e => e.GetProperty("name").GetString() == title);
        ShouldHaveLocation(published);
        published.GetProperty("location").GetProperty("latitude").GetDecimal().Should().Be(43.5512m);
    }
}
