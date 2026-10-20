// Traces to: L2-160
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using SkiaSharp;
using Xunit;

namespace Saturdaze.Api.Tests.PhotoSuggestions;

/// <summary><c>POST /api/auth/me/avatar/suggestion</c>: a suggestion, scaled to 512 px, becomes the profile photo (L2-160).</summary>
public class UseSuggestedAvatarTests : IClassFixture<SaturdazeApiFactory>
{
    private const string Route = "/api/auth/me/avatar/suggestion";
    private readonly SaturdazeApiFactory _factory;

    public UseSuggestedAvatarTests(SaturdazeApiFactory factory) => _factory = factory;

    private static async Task<JsonElement> Body(HttpResponseMessage res) =>
        JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement;

    [Fact]
    public async Task A_suggestion_becomes_the_avatar_no_wider_than_512_px()
    {
        // Traces to: L2-160 AC1
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var first = await PhotoSuggestionSeeder.SuggestAsync(_factory, session.Client, TestPhotos.Jpeg(1600, 900));

        var res = await session.Client.PostAsJsonAsync(Route, new { suggestionId = first.Id });
        var user = await Body(res);
        res.StatusCode.Should().Be(HttpStatusCode.OK, user.ToString());
        var avatarUrl = user.GetProperty("avatarUrl").GetString();
        avatarUrl.Should().StartWith("/api/avatars/");

        var served = await _factory.CreateClient().GetAsync(avatarUrl);
        served.StatusCode.Should().Be(HttpStatusCode.OK);
        served.Content.Headers.ContentType!.MediaType.Should().Be("image/jpeg");
        using var bitmap = SKBitmap.Decode(await served.Content.ReadAsByteArrayAsync());
        bitmap.Should().NotBeNull();
        bitmap!.Width.Should().BeLessThanOrEqualTo(512);
        bitmap.Height.Should().Be(288, "a 16:9 image scaled to 512 px wide");

        var second = await PhotoSuggestionSeeder.SuggestAsync(_factory, session.Client, TestPhotos.Jpeg(300, 300));
        res = await session.Client.PostAsJsonAsync(Route, new { suggestionId = second.Id });
        (await Body(res)).GetProperty("avatarUrl").GetString().Should().NotBe(avatarUrl, "every change retires the previous capability URL");
    }

    [Fact]
    public async Task An_unknown_or_another_users_suggestion_is_404_and_anonymous_is_401()
    {
        // Traces to: L2-160 AC2
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var other = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var theirs = await PhotoSuggestionSeeder.SuggestAsync(_factory, other.Client, TestPhotos.Jpeg());

        foreach (var id in new[] { Guid.NewGuid().ToString("N"), theirs.Id })
        {
            var res = await session.Client.PostAsJsonAsync(Route, new { suggestionId = id });
            var body = await Body(res);
            res.StatusCode.Should().Be(HttpStatusCode.NotFound, body.ToString());
            body.GetProperty("code").GetString().Should().Be("suggestion_not_found");
        }
        var me = await Body(await session.Client.GetAsync("/api/auth/me"));
        me.GetProperty("avatarUrl").ValueKind.Should().Be(JsonValueKind.Null);

        (await _factory.CreateClient().PostAsJsonAsync(Route, new { suggestionId = theirs.Id }))
            .StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
