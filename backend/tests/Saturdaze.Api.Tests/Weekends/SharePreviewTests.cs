using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Xunit;

namespace Saturdaze.Api.Tests.Weekends;

/// <summary>
/// L2-098 AC3: the share link is <c>/s/{token}</c> on the API, which answers link-preview
/// crawlers with Open Graph tags and sends browsers on to the app.
/// </summary>
public class SharePreviewTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public SharePreviewTests(SaturdazeApiFactory factory)
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

    private async Task<(Guid Id, string Token, string ShareUrl)> ShareUploadedWeekendAsync()
    {
        var client = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        var res = await client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = "2026-05-16" });
        res.EnsureSuccessStatusCode();
        var id = JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement.GetProperty("id").GetGuid();
        (await client.PostAsync($"/api/weekends/{id}/cover", TestPhotos.Upload(TestPhotos.Jpeg()))).EnsureSuccessStatusCode();
        var share = JsonDocument.Parse(await (await client.PostAsync($"/api/weekends/{id}/share", null)).Content.ReadAsStringAsync()).RootElement;
        return (id, share.GetProperty("token").GetString()!, share.GetProperty("shareUrl").GetString()!);
    }

    private static string? Meta(string html, string property)
    {
        var m = Regex.Match(html, $"<meta property=\"{Regex.Escape(property)}\" content=\"([^\"]*)\"");
        return m.Success ? WebUtility.HtmlDecode(m.Groups[1].Value) : null;
    }

    [Fact]
    public async Task A_crawler_gets_open_graph_tags_with_a_cover_that_lasts_a_week()
    {
        // Traces to: L2-098 AC3
        var (_, token, shareUrl) = await ShareUploadedWeekendAsync();
        shareUrl.Should().EndWith($"/s/{token}");

        var anonymous = _factory.CreateClient(new() { AllowAutoRedirect = false });
        var res = await anonymous.GetAsync($"/s/{token}");

        res.StatusCode.Should().Be(HttpStatusCode.OK);
        res.Content.Headers.ContentType!.MediaType.Should().Be("text/html");
        var html = await res.Content.ReadAsStringAsync();
        Meta(html, "og:title").Should().NotBeNullOrWhiteSpace();
        Meta(html, "og:description").Should().NotBeNullOrWhiteSpace();
        var image = Meta(html, "og:image");
        image.Should().StartWith("http").And.Contain("/api/photos/");

        var today = _factory.Clock.Today;
        try
        {
            _factory.Clock.Today = today.AddDays(6);
            (await anonymous.GetAsync(new Uri(image!).PathAndQuery)).StatusCode.Should().Be(HttpStatusCode.OK);
        }
        finally
        {
            _factory.Clock.Today = today;
        }
    }

    [Fact]
    public async Task A_browser_is_sent_on_to_the_shared_weekend_in_the_app()
    {
        // Traces to: L2-098 AC3
        var (_, token, _) = await ShareUploadedWeekendAsync();

        var html = await _factory.CreateClient().GetStringAsync($"/s/{token}");

        html.Should().Contain($"https://app.example.com/sample-weekend?share={token}");
        html.Should().Contain("http-equiv=\"refresh\"");
    }

    [Fact]
    public async Task An_invalid_share_token_has_no_preview()
    {
        // Traces to: L2-098 AC3, L2-097 AC6
        var res = await _factory.CreateClient().GetAsync("/s/not-a-token");
        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
