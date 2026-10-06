using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.Auth;

/// <summary>
/// L2-087 — a profile photo replaces the initials avatar. Uploads go through
/// <c>PUT /api/auth/me/avatar</c>; the photo is served from the anonymous
/// capability URL in <c>UserDto.avatarUrl</c>.
/// </summary>
public class ProfilePhotoTests : IClassFixture<SaturdazeApiFactory>
{
    private const string AvatarRoute = "/api/auth/me/avatar";

    // Smallest valid images of each accepted type; only the signature matters.
    private static readonly byte[] Png =
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52];
    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01];
    private static readonly byte[] Webp =
        [0x52, 0x49, 0x46, 0x46, 0x1A, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20];

    private readonly SaturdazeApiFactory _factory;
    public ProfilePhotoTests(SaturdazeApiFactory factory) { _factory = factory; }

    private static MultipartFormDataContent Upload(byte[] bytes, string contentType, string fileName = "photo")
    {
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        return new MultipartFormDataContent { { file, "file", fileName } };
    }

    private static async Task<AuthDtos.User> UploadOk(HttpClient client, byte[] bytes, string contentType)
    {
        var res = await client.PutAsync(AvatarRoute, Upload(bytes, contentType));
        res.StatusCode.Should().Be(HttpStatusCode.OK, await res.Content.ReadAsStringAsync());
        return (await res.Content.ReadFromJsonAsync<AuthDtos.User>())!;
    }

    [Theory]
    [InlineData("png", "image/png")]
    [InlineData("jpeg", "image/jpeg")]
    [InlineData("webp", "image/webp")]
    public async Task Upload_returns_avatar_url_that_serves_the_image_anonymously(string kind, string contentType)
    {
        var bytes = kind switch { "png" => Png, "jpeg" => Jpeg, _ => Webp };
        var session = await SignedInClient.CreateAsync(_factory);

        var user = await UploadOk(session.Client, bytes, contentType);

        user.AvatarUrl.Should().StartWith("/api/avatars/");
        var image = await _factory.CreateClient().GetAsync(user.AvatarUrl);
        image.StatusCode.Should().Be(HttpStatusCode.OK);
        image.Content.Headers.ContentType!.MediaType.Should().Be(contentType);
        (await image.Content.ReadAsByteArrayAsync()).Should().Equal(bytes);
    }

    [Fact]
    public async Task Me_and_login_carry_the_avatar_url_once_a_photo_is_set()
    {
        var session = await SignedInClient.CreateAsync(_factory);

        var before = await session.Client.GetFromJsonAsync<AuthDtos.User>("/api/auth/me");
        before!.AvatarUrl.Should().BeNull();

        var uploaded = await UploadOk(session.Client, Png, "image/png");

        var me = await session.Client.GetFromJsonAsync<AuthDtos.User>("/api/auth/me");
        me!.AvatarUrl.Should().Be(uploaded.AvatarUrl);

        var login = await _factory.CreateClient().PostAsJsonAsync("/api/auth/login",
            new AuthDtos.LoginRequest(session.Email, SignedInClient.Password));
        var body = await login.Content.ReadFromJsonAsync<AuthDtos.AuthSuccess>();
        body!.User.AvatarUrl.Should().Be(uploaded.AvatarUrl);
    }

    [Fact]
    public async Task Avatar_endpoints_require_a_bearer()
    {
        var anon = _factory.CreateClient();

        (await anon.PutAsync(AvatarRoute, Upload(Png, "image/png"))).StatusCode
            .Should().Be(HttpStatusCode.Unauthorized);
        (await anon.DeleteAsync(AvatarRoute)).StatusCode
            .Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Unknown_avatar_token_returns_404()
    {
        var res = await _factory.CreateClient().GetAsync($"/api/avatars/{Guid.NewGuid():N}");
        res.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
