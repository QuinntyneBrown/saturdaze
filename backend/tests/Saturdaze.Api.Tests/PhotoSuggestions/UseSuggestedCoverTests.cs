// Traces to: L2-158
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.PhotoSuggestions;

/// <summary><c>POST /api/weekends/{id}/cover/suggestion</c>: a suggestion becomes the cover, stored as an upload with its credit (L2-158).</summary>
public class UseSuggestedCoverTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public UseSuggestedCoverTests(SaturdazeApiFactory factory)
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

    private async Task<(HttpClient Client, Guid WeekendId)> PlanAsync()
    {
        var client = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        var res = await client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = "2026-05-16" });
        res.EnsureSuccessStatusCode();
        return (client, JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid());
    }

    private static async Task<JsonElement> Body(HttpResponseMessage res) =>
        JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement;

    [Fact]
    public async Task A_suggestion_becomes_the_cover_labelled_from_the_web_with_its_credit()
    {
        // Traces to: L2-158 AC1
        var (client, weekendId) = await PlanAsync();
        var seeded = await PhotoSuggestionSeeder.SuggestAsync(_factory, client, TestPhotos.JpegWithGps());

        var res = await client.PostAsJsonAsync($"/api/weekends/{weekendId}/cover/suggestion", new { suggestionId = seeded.Id });
        var body = await Body(res);
        res.StatusCode.Should().Be(HttpStatusCode.OK, body.ToString());
        var cover = body.GetProperty("cover");
        cover.GetProperty("source").GetString().Should().Be("upload");
        cover.GetProperty("label").GetString().Should().Be("From the web");
        cover.GetProperty("attribution").GetString().Should().Be("Photo · Terre Bleu Lavender Farm");
        var url = cover.GetProperty("url").GetString()!;
        url.Should().StartWith("/api/photos/").And.Contain("sig=");

        var served = await _factory.CreateClient().GetAsync(url);
        served.StatusCode.Should().Be(HttpStatusCode.OK);
        served.Content.Headers.ContentType!.MediaType.Should().Be("image/jpeg");
        TestPhotos.Contains(await served.Content.ReadAsByteArrayAsync(), "Exif\0\0"u8.ToArray()).Should().BeFalse();

        var current = await Body(await client.GetAsync("/api/weekends/current"));
        current.GetProperty("cover").GetProperty("label").GetString().Should().Be("From the web");
        current.GetProperty("cover").GetProperty("attribution").GetString().Should().Be("Photo · Terre Bleu Lavender Farm");
    }

    [Fact]
    public async Task An_unknown_or_another_users_suggestion_is_404_and_the_cover_stays()
    {
        // Traces to: L2-158 AC2
        var (client, weekendId) = await PlanAsync();
        var before = (await Body(await client.GetAsync("/api/weekends/current"))).GetProperty("cover").ToString();
        var other = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var theirs = await PhotoSuggestionSeeder.SuggestAsync(_factory, other.Client, TestPhotos.Jpeg());

        foreach (var id in new[] { Guid.NewGuid().ToString("N"), theirs.Id })
        {
            var res = await client.PostAsJsonAsync($"/api/weekends/{weekendId}/cover/suggestion", new { suggestionId = id });
            var body = await Body(res);
            res.StatusCode.Should().Be(HttpStatusCode.NotFound, body.ToString());
            body.GetProperty("code").GetString().Should().Be("suggestion_not_found");
        }

        var after = (await Body(await client.GetAsync("/api/weekends/current"))).GetProperty("cover").ToString();
        after.Should().Be(before);
    }

    [Fact]
    public async Task Another_familys_weekend_is_404_and_anonymous_is_401()
    {
        // Traces to: L2-158 AC3
        var (_, weekendId) = await PlanAsync();
        var other = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var theirs = await PhotoSuggestionSeeder.SuggestAsync(_factory, other.Client, TestPhotos.Jpeg());

        (await other.Client.PostAsJsonAsync($"/api/weekends/{weekendId}/cover/suggestion", new { suggestionId = theirs.Id }))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await _factory.CreateClient().PostAsJsonAsync($"/api/weekends/{weekendId}/cover/suggestion", new { suggestionId = theirs.Id }))
            .StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
