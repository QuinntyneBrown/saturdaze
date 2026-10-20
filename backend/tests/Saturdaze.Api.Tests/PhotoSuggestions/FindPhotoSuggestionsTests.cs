// Traces to: L2-157
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Photos;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Enums;
using SkiaSharp;
using Xunit;

namespace Saturdaze.Api.Tests.PhotoSuggestions;

/// <summary>
/// <c>POST /api/photo-suggestions</c>: Claude researches the context, the API fetches, verifies
/// and cleans each candidate, and serves signed previews from its own origin (L2-157).
/// </summary>
public class FindPhotoSuggestionsTests : IClassFixture<SaturdazeApiFactory>
{
    private const string Route = "/api/photo-suggestions";
    private readonly SaturdazeApiFactory _factory;

    public FindPhotoSuggestionsTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = (_, _, from, to) =>
        {
            var days = new List<WeatherForecast>();
            for (var d = from; d <= to; d = d.AddDays(1))
                days.Add(new WeatherForecast(d, new[] { "sunny" }, 24, 16, 0.0, false));
            return days;
        };
        _factory.Search.Fail = false;
        _factory.Search.RawText = "[]";
    }

    private static string Candidate(string imageUrl, string attribution = "Photo · Someone", string title = "A photo") =>
        $$"""{ "imageUrl": "{{imageUrl}}", "title": "{{title}}", "sourceName": "Wikimedia Commons", "sourceUrl": "https://commons.wikimedia.org/wiki/File:X.jpg", "attribution": "{{attribution}}", "licence": "CC BY-SA 4.0" }""";

    private static byte[] Png(int width, int height)
    {
        using var bitmap = new SKBitmap(width, height);
        bitmap.Erase(new SKColor(20, 90, 200));
        using var data = bitmap.Encode(SKEncodedImageFormat.Png, 100);
        return data.ToArray();
    }

    private async Task<(HttpClient Client, Guid WeekendId, List<string> Stops)> PlanAsync()
    {
        var client = (await SignedInClient.CreateAsync(_factory, FamilyMode.Own)).Client;
        var res = await client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = "2026-05-16" });
        res.EnsureSuccessStatusCode();
        var weekend = JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement;
        var stops = weekend.GetProperty("blocks").EnumerateArray()
            .Where(b => b.GetProperty("kind").GetString() == "Activity" && b.GetProperty("refId").ValueKind == JsonValueKind.String)
            .Select(b => b.GetProperty("title").GetString()!)
            .Distinct()
            .ToList();
        return (client, weekend.GetProperty("id").GetGuid(), stops);
    }

    private static async Task<JsonElement> Body(HttpResponseMessage res) =>
        JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement;

    private static string? Code(JsonElement body) =>
        body.TryGetProperty("code", out var code) ? code.GetString() : null;

    [Fact]
    public async Task A_weekend_cover_search_names_the_stops_and_returns_each_verified_candidate()
    {
        // Traces to: L2-157 AC1
        var (client, weekendId, stops) = await PlanAsync();
        stops.Should().NotBeEmpty("the planner gives the weekend activity stops");
        const string jpegUrl = "https://upload.wikimedia.org/terre-bleu.jpg";
        const string pngUrl = "https://www.terrebleu.ca/photos/rows.png";
        _factory.PublicImages.Responses[jpegUrl] = TestPhotos.Jpeg(1600, 900);
        _factory.PublicImages.Responses[pngUrl] = Png(1200, 800);
        var first = Candidate(jpegUrl, title: "Lavender rows");
        var second = Candidate(pngUrl, "Photo · Terre Bleu", "Farm at dusk");
        _factory.Search.RawText = "Here are some photos:\n```json\n[" + first + ", " + second + "]\n```";

        var res = await client.PostAsJsonAsync(Route, new { target = "weekendCover", weekendId });
        var body = await Body(res);
        res.StatusCode.Should().Be(HttpStatusCode.OK, body.ToString());

        var prompt = _factory.Search.Requests.Last().User;
        foreach (var stop in stops) prompt.Should().Contain(stop);

        var suggestions = body.GetProperty("suggestions").EnumerateArray().ToList();
        suggestions.Should().HaveCount(2);
        foreach (var s in suggestions)
        {
            s.GetProperty("id").GetString().Should().NotBeNullOrEmpty();
            s.GetProperty("previewUrl").GetString().Should().StartWith("/api/photo-suggestions/").And.Contain("sig=");
            s.GetProperty("title").GetString().Should().NotBeNullOrEmpty();
            s.GetProperty("sourceName").GetString().Should().Be("Wikimedia Commons");
            s.GetProperty("sourceUrl").GetString().Should().StartWith("https://commons.wikimedia.org/");
            s.GetProperty("attribution").GetString().Should().NotBeNullOrEmpty();
            s.GetProperty("licence").GetString().Should().Be("CC BY-SA 4.0");
        }
        var png = suggestions.Single(s => s.GetProperty("title").GetString() == "Farm at dusk");
        png.GetProperty("width").GetInt32().Should().Be(1200);
        png.GetProperty("height").GetInt32().Should().Be(800);
        png.GetProperty("attribution").GetString().Should().Be("Photo · Terre Bleu");
    }

    [Fact]
    public async Task Unsafe_or_unusable_candidates_are_dropped_and_blocked_addresses_are_never_fetched()
    {
        // Traces to: L2-157 AC2
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        const string good = "https://upload.wikimedia.org/good.jpg";
        const string html = "https://example.org/page.html";
        _factory.PublicImages.Responses[good] = TestPhotos.Jpeg();
        _factory.PublicImages.Responses[html] = Encoding.UTF8.GetBytes("<!doctype html><html><body>no</body></html>");
        var blocked = new[]
        {
            "http://upload.wikimedia.org/plain.jpg",
            "https://127.0.0.1/loop.jpg",
            "https://10.0.0.5/private.jpg",
            "https://169.254.169.254/latest/meta-data",
            "https://[::1]/loop6.jpg",
            "https://localhost/local.jpg",
        };
        var candidates = blocked.Select(u => Candidate(u)).Concat(new[]
        {
            Candidate(html),
            Candidate("https://upload.wikimedia.org/no-credit.jpg", attribution: ""),
            Candidate(good),
        });
        _factory.Search.RawText = "[" + string.Join(",", candidates) + "]";
        var fetchedBefore = _factory.PublicImages.Requested.Count;

        var res = await session.Client.PostAsJsonAsync(Route, new { target = "profile", query = "lavender" });
        var body = await Body(res);
        res.StatusCode.Should().Be(HttpStatusCode.OK, body.ToString());
        body.GetProperty("suggestions").GetArrayLength().Should().Be(1);

        var fetched = _factory.PublicImages.Requested.Skip(fetchedBefore).Select(u => u.ToString()).ToList();
        fetched.Should().Contain(good);
        foreach (var u in blocked) fetched.Should().NotContain(u);
        fetched.Should().NotContain("https://upload.wikimedia.org/no-credit.jpg", "a candidate without attribution is dropped before any fetch");

        _factory.Search.RawText = "[" + Candidate("https://10.0.0.5/private.jpg") + "]";
        res = await session.Client.PostAsJsonAsync(Route, new { target = "profile", query = "lavender" });
        body = await Body(res);
        res.StatusCode.Should().Be(HttpStatusCode.OK, body.ToString());
        body.GetProperty("suggestions").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task A_preview_is_served_cleaned_while_signed_and_refused_afterwards()
    {
        // Traces to: L2-157 AC3
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        const string url = "https://upload.wikimedia.org/gps.jpg";
        _factory.PublicImages.Responses[url] = TestPhotos.JpegWithGps();
        _factory.Search.RawText = "[" + Candidate(url) + "]";
        _factory.Clock.TimeOfDay = TimeSpan.FromHours(10);

        var res = await session.Client.PostAsJsonAsync(Route, new { target = "profile", query = "lavender" });
        var body = await Body(res);
        res.StatusCode.Should().Be(HttpStatusCode.OK, body.ToString());
        var previewUrl = body.GetProperty("suggestions")[0].GetProperty("previewUrl").GetString()!;

        var anon = _factory.CreateClient();
        var preview = await anon.GetAsync(previewUrl);
        preview.StatusCode.Should().Be(HttpStatusCode.OK);
        preview.Content.Headers.ContentType!.MediaType.Should().Be("image/jpeg");
        preview.Headers.CacheControl!.Private.Should().BeTrue();
        preview.Headers.GetValues("X-Content-Type-Options").Should().ContainSingle("nosniff");
        var bytes = await preview.Content.ReadAsByteArrayAsync();
        TestPhotos.Contains(bytes, "Exif\0\0"u8.ToArray()).Should().BeFalse("metadata is stripped");

        var tampered = previewUrl[..^4] + "zzzz";
        (await anon.GetAsync(tampered)).StatusCode.Should().Be(HttpStatusCode.Forbidden);

        var signer = _factory.Services.GetRequiredService<IPhotoUrlSigner>();
        var unknown = signer.SignedUrl("suggestion:" + Guid.NewGuid().ToString("N"), TimeSpan.FromMinutes(5), "/api/photo-suggestions");
        (await anon.GetAsync(unknown)).StatusCode.Should().Be(HttpStatusCode.NotFound);

        _factory.Clock.TimeOfDay = TimeSpan.FromHours(10) + TimeSpan.FromMinutes(16);
        (await anon.GetAsync(previewUrl)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        _factory.Clock.TimeOfDay = TimeSpan.Zero;
    }

    [Fact]
    public async Task Anonymous_other_family_and_non_admin_place_searches_are_refused()
    {
        // Traces to: L2-157 AC4
        var (_, weekendId, _) = await PlanAsync();
        var other = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var searchesBefore = _factory.Search.Requests.Count;

        (await _factory.CreateClient().PostAsJsonAsync(Route, new { target = "profile", query = "lavender" }))
            .StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        (await other.Client.PostAsJsonAsync(Route, new { target = "weekendCover", weekendId }))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);

        var res = await other.Client.PostAsJsonAsync(Route, new { target = "place", kind = "Activity", placeId = Guid.NewGuid() });
        res.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        _factory.Search.Requests.Count.Should().Be(searchesBefore, "a refused search never reaches Claude");
    }

    [Fact]
    public async Task A_profile_search_needs_a_query_and_the_target_is_checked()
    {
        // Traces to: L2-157 AC5
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var res = await session.Client.PostAsJsonAsync(Route, new { target = "profile" });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await res.Content.ReadAsStringAsync()).Should().Contain("query");

        res = await session.Client.PostAsJsonAsync(Route, new { target = "profile", query = new string('a', 121) });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await res.Content.ReadAsStringAsync()).Should().Contain("query");

        res = await session.Client.PostAsJsonAsync(Route, new { target = "banner", query = "lavender" });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await res.Content.ReadAsStringAsync()).Should().Contain("target");
    }

    [Fact]
    public async Task A_failing_claude_endpoint_is_503_and_stores_nothing()
    {
        // Traces to: L2-157 AC6
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        _factory.Search.Fail = true;
        var fetchedBefore = _factory.PublicImages.Requested.Count;

        var res = await session.Client.PostAsJsonAsync(Route, new { target = "profile", query = "lavender" });
        var body = await Body(res);
        res.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable, body.ToString());
        Code(body).Should().Be("suggestions_unavailable");
        _factory.PublicImages.Requested.Count.Should().Be(fetchedBefore);
    }

    [Fact]
    public async Task The_twenty_first_search_in_an_hour_is_refused_before_claude_is_called()
    {
        // Traces to: L2-157 AC7
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        for (var i = 0; i < 20; i++)
        {
            var ok = await session.Client.PostAsJsonAsync(Route, new { target = "profile", query = "lavender" });
            ok.StatusCode.Should().Be(HttpStatusCode.OK, $"search {i + 1} is within the quota");
        }
        var searches = _factory.Search.Requests.Count;

        var res = await session.Client.PostAsJsonAsync(Route, new { target = "profile", query = "lavender" });
        var body = await Body(res);
        res.StatusCode.Should().Be(HttpStatusCode.TooManyRequests, body.ToString());
        Code(body).Should().Be("suggestion_limit");
        _factory.Search.Requests.Count.Should().Be(searches);
    }

    [Fact]
    public async Task The_log_records_the_target_and_counts_but_no_image_bytes()
    {
        // Traces to: L2-157 AC8
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        const string url = "https://upload.wikimedia.org/logged.jpg";
        _factory.PublicImages.Responses[url] = TestPhotos.Jpeg();
        _factory.Search.RawText = "[" + Candidate(url) + "," + Candidate("https://upload.wikimedia.org/missing.jpg") + "]";

        var res = await session.Client.PostAsJsonAsync(Route, new { target = "profile", query = "lavender" });
        res.StatusCode.Should().Be(HttpStatusCode.OK);

        var line = _factory.Logs.Messages.LastOrDefault(m => m.Contains("Photo suggestions"));
        line.Should().NotBeNull();
        line.Should().Contain("Profile").And.Contain("2 candidate").And.Contain("1 accepted");
        line.Should().NotContain("\xFF\xD8");
    }
}
