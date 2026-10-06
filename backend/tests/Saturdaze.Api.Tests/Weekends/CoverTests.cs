using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Weekends;

/// <summary>
/// L2-108: every weekend has a cover — the photo of Saturday's highlight, else Sunday's —
/// which the family can change to another stop's photo. "Port Credit Memorial Park" has
/// an allow-listed photo in the test seed; adding it to Sunday guarantees a stop with one.
/// </summary>
public class CoverTests : IClassFixture<SaturdazeApiFactory>
{
    private const string PhotoPlace = "Port Credit Memorial Park";
    private const string PhotoUrl = "https://images.example.com/memorial-park.jpg";
    private readonly SaturdazeApiFactory _factory;

    public CoverTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = (_, _, from, to) =>
        {
            var days = new List<WeatherForecast>();
            for (var d = from; d <= to; d = d.AddDays(1))
                days.Add(new WeatherForecast(d, new[] { "sunny", "warm" }, 24, 16, 0.0, false));
            return days;
        };
    }

    private sealed record Plan(HttpClient Client, Guid WeekendId, Guid PlaceId, JsonElement Weekend);

    private async Task<Plan> PlanWithPhotoStopAsync()
    {
        var client = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        var planned = await client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = "2026-05-16" });
        planned.EnsureSuccessStatusCode();
        var id = JsonDocument.Parse(await planned.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid();

        var activities = JsonDocument.Parse(await client.GetStringAsync("/api/activities")).RootElement;
        var placeId = activities.EnumerateArray().Single(a => a.GetProperty("name").GetString() == PhotoPlace)
            .GetProperty("id").GetGuid();
        var added = await client.PostAsJsonAsync($"/api/weekends/{id}/ideas",
            new { IdeaKind = "activity", IdeaId = placeId, Day = "Sunday", Timing = "bestFit" });
        var body = await added.Content.ReadAsStringAsync();
        added.StatusCode.Should().Be(HttpStatusCode.OK, body);
        return new Plan(client, id, placeId, JsonDocument.Parse(body).RootElement.Clone());
    }

    private static List<JsonElement> StopBlocks(JsonElement weekend, Guid placeId) =>
        weekend.GetProperty("blocks").EnumerateArray()
            .Where(b => b.GetProperty("refId").GetString() == placeId.ToString() && b.GetProperty("kind").GetString() == "Activity")
            .ToList();

    private static JsonElement? Highlight(JsonElement weekend, string day) =>
        weekend.GetProperty("blocks").EnumerateArray()
            .Where(b => b.GetProperty("day").GetString() == day && b.GetProperty("kind").GetString() == "Activity")
            .Select(b => (JsonElement?)b)
            .FirstOrDefault();

    private static JsonElement? Photo(JsonElement? block) =>
        block is { } b && b.TryGetProperty("photo", out var p) && p.ValueKind == JsonValueKind.Object ? p : null;

    [Fact]
    public async Task A_new_weekend_takes_its_cover_from_saturdays_highlight_else_sundays()
    {
        // Traces to: L2-108 AC1, AC3
        var plan = await PlanWithPhotoStopAsync();
        var w = plan.Weekend;

        var stop = StopBlocks(w, plan.PlaceId).First();
        Photo(stop)!.Value.GetProperty("url").GetString().Should().Be(PhotoUrl, "stops carry their place photo");

        var expected = Photo(Highlight(w, "Saturday")) ?? Photo(Highlight(w, "Sunday"));
        var cover = w.GetProperty("cover");
        if (expected is null)
        {
            cover.ValueKind.Should().Be(JsonValueKind.Null);
            return;
        }

        cover.GetProperty("url").GetString().Should().Be(expected.Value.GetProperty("url").GetString());
        cover.GetProperty("source").GetString().Should().Be("default");
        cover.GetProperty("label").GetString().Should().StartWith("From ");
    }

    [Fact]
    public async Task Choosing_another_stops_photo_persists()
    {
        // Traces to: L2-108 AC2
        var plan = await PlanWithPhotoStopAsync();

        var res = await plan.Client.PutAsJsonAsync($"/api/weekends/{plan.WeekendId}/cover",
            new { Source = "stop", PlaceId = plan.PlaceId });
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var cover = JsonDocument.Parse(body).RootElement.GetProperty("cover");
        cover.GetProperty("url").GetString().Should().Be(PhotoUrl);
        cover.GetProperty("label").GetString().Should().Be($"From {PhotoPlace}");
        cover.GetProperty("source").GetString().Should().Be("stop");

        var reloaded = JsonDocument.Parse(await plan.Client.GetStringAsync($"/api/weekends/{plan.WeekendId}")).RootElement;
        reloaded.GetProperty("cover").GetProperty("url").GetString().Should().Be(PhotoUrl);
    }

    [Fact]
    public async Task Only_a_stop_of_this_weekend_with_a_photo_can_be_the_cover()
    {
        // Traces to: L2-108 AC2
        var plan = await PlanWithPhotoStopAsync();
        var res = await plan.Client.PutAsJsonAsync($"/api/weekends/{plan.WeekendId}/cover",
            new { Source = "stop", PlaceId = Guid.NewGuid() });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var back = await plan.Client.PutAsJsonAsync($"/api/weekends/{plan.WeekendId}/cover", new { Source = "default" });
        back.StatusCode.Should().Be(HttpStatusCode.OK);
        var cover = JsonDocument.Parse(await back.Content.ReadAsStringAsync()).RootElement.GetProperty("cover");
        if (cover.ValueKind == JsonValueKind.Object) cover.GetProperty("source").GetString().Should().Be("default");
    }

    [Fact]
    public async Task A_chosen_cover_survives_regeneration_while_its_stop_does()
    {
        // Traces to: L2-108 AC6
        var plan = await PlanWithPhotoStopAsync();
        (await plan.Client.PutAsJsonAsync($"/api/weekends/{plan.WeekendId}/cover",
            new { Source = "stop", PlaceId = plan.PlaceId })).EnsureSuccessStatusCode();
        foreach (var block in StopBlocks(plan.Weekend, plan.PlaceId))
            (await plan.Client.PutAsJsonAsync($"/api/blocks/{block.GetProperty("id").GetGuid()}/lock",
                new { Locked = true })).EnsureSuccessStatusCode();

        var regenerated = await plan.Client.PostAsync($"/api/weekends/{plan.WeekendId}/regenerate", content: null);
        var body = await regenerated.Content.ReadAsStringAsync();
        regenerated.StatusCode.Should().Be(HttpStatusCode.OK, body);
        JsonDocument.Parse(body).RootElement.GetProperty("cover").GetProperty("url").GetString().Should().Be(PhotoUrl);
    }

    [Fact]
    public async Task A_chosen_cover_reverts_to_the_default_rule_once_its_stop_is_gone()
    {
        // Traces to: L2-108 AC6
        var plan = await PlanWithPhotoStopAsync();
        (await plan.Client.PutAsJsonAsync($"/api/weekends/{plan.WeekendId}/cover",
            new { Source = "stop", PlaceId = plan.PlaceId })).EnsureSuccessStatusCode();

        var w = plan.Weekend;
        foreach (var block in StopBlocks(plan.Weekend, plan.PlaceId))
        {
            var swapped = await plan.Client.PostAsJsonAsync($"/api/blocks/{block.GetProperty("id").GetGuid()}/swap",
                new { RejectedActivityIds = new[] { plan.PlaceId } });
            var body = await swapped.Content.ReadAsStringAsync();
            swapped.StatusCode.Should().Be(HttpStatusCode.OK, body);
            w = JsonDocument.Parse(body).RootElement.Clone();
        }

        w.GetProperty("blocks").EnumerateArray()
            .Any(b => b.GetProperty("refId").GetString() == plan.PlaceId.ToString())
            .Should().BeFalse("the swap replaced the stop");
        var expected = Photo(Highlight(w, "Saturday")) ?? Photo(Highlight(w, "Sunday"));
        var cover = w.GetProperty("cover");
        if (expected is null) cover.ValueKind.Should().Be(JsonValueKind.Null);
        else cover.GetProperty("url").GetString().Should().Be(expected.Value.GetProperty("url").GetString());
    }

    [Fact]
    public async Task Another_family_cannot_change_the_cover()
    {
        // Traces to: L2-108, family scoping
        var plan = await PlanWithPhotoStopAsync();
        var stranger = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        var res = await stranger.PutAsJsonAsync($"/api/weekends/{plan.WeekendId}/cover",
            new { Source = "stop", PlaceId = plan.PlaceId });
        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
