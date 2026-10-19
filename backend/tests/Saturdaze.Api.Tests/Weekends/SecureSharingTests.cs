// Acceptance Test
// Traces to: L2-086 AC5-AC9
// Description: Share links are random, expire after 7 days, can be stopped, and expose only what a viewer needs.

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Weekends;

public class SecureSharingTests : IClassFixture<SaturdazeApiFactory>
{
    private static readonly TimeSpan SharedAt = TimeSpan.FromHours(9);
    private readonly SaturdazeApiFactory _factory;

    public SecureSharingTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Clock.Today = new DateOnly(2026, 5, 16);
        _factory.Clock.TimeOfDay = SharedAt;
        _factory.Weather.Producer = (_, _, from, to) =>
        {
            var days = new List<WeatherForecast>();
            for (var d = from; d <= to; d = d.AddDays(1))
                days.Add(new WeatherForecast(d, new[] { "sunny" }, 24, 16, 0.0, false));
            return days;
        };
    }

    private async Task<(HttpClient Owner, Guid WeekendId, string Token)> ShareAsync()
    {
        var owner = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        // Give the weekend data a viewer must not see.
        (await owner.PutAsJsonAsync("/api/family", new { HomeLocation = "12 Private Lane, Port Credit" }))
            .EnsureSuccessStatusCode();
        var weekend = await Read(await owner.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = "2026-05-16" }));
        var id = weekend.GetProperty("id").GetGuid();
        (await owner.PostAsJsonAsync($"/api/weekends/{id}/errands",
            new { Description = "Costco run", EstimatedMinutes = 60 })).EnsureSuccessStatusCode();
        (await owner.PutAsJsonAsync($"/api/weekends/{id}/rating", new { Rating = 4 })).EnsureSuccessStatusCode();
        var share = await Read(await owner.PostAsync($"/api/weekends/{id}/share", content: null));
        return (owner, id, share.GetProperty("token").GetString()!);
    }

    [Fact]
    public async Task A_share_link_works_for_seven_days_and_then_stops()
    {
        // Traces to: L2-086 AC5
        var (_, _, token) = await ShareAsync();
        var anonymous = _factory.CreateClient();
        try
        {
            _factory.Clock.TimeOfDay = SharedAt + TimeSpan.FromDays(7) - TimeSpan.FromMinutes(1);
            (await anonymous.GetAsync($"/api/weekends/shared/{token}")).StatusCode.Should().Be(HttpStatusCode.OK);

            _factory.Clock.TimeOfDay = SharedAt + TimeSpan.FromDays(7) + TimeSpan.FromMinutes(1);
            (await anonymous.GetAsync($"/api/weekends/shared/{token}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
            (await anonymous.GetAsync($"/api/weekends/shared/{token}/calendar.ics")).StatusCode
                .Should().Be(HttpStatusCode.NotFound);
        }
        finally
        {
            _factory.Clock.TimeOfDay = SharedAt;
        }
    }

    [Fact]
    public async Task Stopping_sharing_retires_every_link_to_the_weekend()
    {
        // Traces to: L2-086 AC6
        var (owner, id, first) = await ShareAsync();
        var second = (await Read(await owner.PostAsync($"/api/weekends/{id}/share", content: null)))
            .GetProperty("token").GetString();

        (await owner.DeleteAsync($"/api/weekends/{id}/share")).StatusCode.Should().Be(HttpStatusCode.NoContent);

        var anonymous = _factory.CreateClient();
        foreach (var token in new[] { first, second })
        {
            (await anonymous.GetAsync($"/api/weekends/shared/{token}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
            (await anonymous.GetAsync($"/api/weekends/shared/{token}/calendar.ics")).StatusCode
                .Should().Be(HttpStatusCode.NotFound);
        }
    }

    [Fact]
    public async Task Another_family_cannot_stop_sharing_a_weekend()
    {
        // Traces to: L2-086 AC6 (family scope)
        var (_, id, token) = await ShareAsync();
        var stranger = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;

        (await stranger.DeleteAsync($"/api/weekends/{id}/share")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await _factory.CreateClient().GetAsync($"/api/weekends/shared/{token}")).StatusCode
            .Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task The_shared_weekend_leaves_out_what_only_the_family_should_see()
    {
        // Traces to: L2-086 AC7
        var (_, _, token) = await ShareAsync();
        var response = await _factory.CreateClient().GetAsync($"/api/weekends/shared/{token}");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var shared = JsonDocument.Parse(body).RootElement;

        body.Should().NotContain("Private Lane").And.NotContain("Costco run");
        foreach (var field in new[] { "notes", "home", "rating", "isFavourite", "regenerateCount" })
            Absent(shared, field);
        (!shared.TryGetProperty("errands", out var errands) || errands.GetArrayLength() == 0).Should().BeTrue();
        shared.GetProperty("blocks").GetArrayLength().Should().BeGreaterThan(0);
        foreach (var block in shared.GetProperty("blocks").EnumerateArray())
            Absent(block, "reason");
    }

    [Fact]
    public async Task A_weekend_id_is_not_a_share_token()
    {
        // Traces to: L2-086 AC8
        var (_, id, _) = await ShareAsync();
        var guessed = Convert.ToBase64String(id.ToByteArray()).TrimEnd('=').Replace('+', '-').Replace('/', '_');

        (await _factory.CreateClient().GetAsync($"/api/weekends/shared/{guessed}")).StatusCode
            .Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task The_shared_calendar_is_anonymous_and_the_owners_needs_a_bearer()
    {
        // Traces to: L2-086 AC9
        var (owner, id, token) = await ShareAsync();
        var anonymous = _factory.CreateClient();

        var shared = await anonymous.GetAsync($"/api/weekends/shared/{token}/calendar.ics");
        shared.StatusCode.Should().Be(HttpStatusCode.OK);
        shared.Content.Headers.ContentType!.MediaType.Should().Be("text/calendar");
        var ics = await shared.Content.ReadAsStringAsync();
        ics.Should().Contain("BEGIN:VEVENT").And.NotContain("DESCRIPTION:");

        (await anonymous.GetAsync($"/api/weekends/{id}/calendar.ics")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await owner.GetAsync($"/api/weekends/{id}/calendar.ics")).StatusCode.Should().Be(HttpStatusCode.OK);
        var stranger = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        (await stranger.GetAsync($"/api/weekends/{id}/calendar.ics")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private static void Absent(JsonElement element, string property)
    {
        if (element.TryGetProperty(property, out var value))
            value.ValueKind.Should().Be(JsonValueKind.Null, $"{property} must not reach a share viewer");
    }

    private static async Task<JsonElement> Read(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();
        response.IsSuccessStatusCode.Should().BeTrue(body);
        return JsonDocument.Parse(body).RootElement.Clone();
    }
}
