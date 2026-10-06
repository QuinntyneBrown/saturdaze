using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Weekends;

/// <summary>L2-110 AC1, AC2: each weekend in history carries the same cover the Weekend screen shows.</summary>
public class PastCoverTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public PastCoverTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = (_, _, from, to) =>
        {
            var days = new List<WeatherForecast>();
            for (var d = from; d <= to; d = d.AddDays(1))
                days.Add(new WeatherForecast(d, new[] { "sunny" }, 24, 16, 0.0, false));
            return days;
        };
    }

    private async Task<(HttpClient Client, Guid WeekendId, JsonElement Weekend)> PlanAsync()
    {
        var client = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        var res = await client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = "2026-05-16" });
        res.EnsureSuccessStatusCode();
        var weekend = JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement.Clone();
        return (client, weekend.GetProperty("id").GetGuid(), weekend);
    }

    private static async Task<JsonElement> SummaryAsync(HttpClient client, Guid id)
    {
        var history = JsonDocument.Parse(await client.GetStringAsync("/api/weekends/history")).RootElement;
        return history.EnumerateArray().Single(w => w.GetProperty("id").GetGuid() == id).Clone();
    }

    [Fact]
    public async Task A_family_uploaded_cover_shows_in_history_labelled_your_photo()
    {
        // Traces to: L2-110 AC1
        var (client, id, _) = await PlanAsync();
        (await client.PostAsync($"/api/weekends/{id}/cover", TestPhotos.Upload(TestPhotos.Jpeg()))).EnsureSuccessStatusCode();

        var cover = (await SummaryAsync(client, id)).GetProperty("cover");

        cover.GetProperty("label").GetString().Should().Be("Your photo");
        cover.GetProperty("source").GetString().Should().Be("upload");
        var photo = await _factory.CreateClient().GetAsync(cover.GetProperty("url").GetString());
        photo.StatusCode.Should().Be(HttpStatusCode.OK);
        photo.Content.Headers.ContentType!.MediaType.Should().Be("image/jpeg");
    }

    [Fact]
    public async Task History_shows_the_same_cover_as_the_weekend_or_none()
    {
        // Traces to: L2-110 AC1, AC2
        var (client, id, weekend) = await PlanAsync();

        var cover = (await SummaryAsync(client, id)).GetProperty("cover");
        var expected = weekend.GetProperty("cover");

        if (expected.ValueKind == JsonValueKind.Null)
        {
            cover.ValueKind.Should().Be(JsonValueKind.Null, "a weekend without a cover offers 'Add a photo'");
            return;
        }

        cover.GetProperty("url").GetString().Should().Be(expected.GetProperty("url").GetString());
        cover.GetProperty("label").GetString().Should().Be(expected.GetProperty("label").GetString());
    }
}
