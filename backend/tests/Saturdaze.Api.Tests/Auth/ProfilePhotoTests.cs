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

    public static TheoryData<string, byte[], string> RejectedFiles() => new()
    {
        { "empty", [], "image/png" },
        { "svg declared as png", "<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>"u8.ToArray(), "image/png" },
        { "text", "not an image"u8.ToArray(), "text/plain" },
        { "png over 2 MB", [.. Png, .. new byte[2 * 1024 * 1024]], "image/png" },
    };

    [Theory]
    [MemberData(nameof(RejectedFiles))]
    public async Task Rejected_file_returns_400_naming_file_and_keeps_the_current_photo(
        string _, byte[] bytes, string contentType)
    {
        var session = await SignedInClient.CreateAsync(_factory);
        var current = await UploadOk(session.Client, Jpeg, "image/jpeg");

        var res = await session.Client.PutAsync(AvatarRoute, Upload(bytes, contentType));

        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await res.Content.ReadFromJsonAsync<ValidationProblem>();
        problem!.Errors.Keys.Should().Contain(k => string.Equals(k, "file", StringComparison.OrdinalIgnoreCase));

        var me = await session.Client.GetFromJsonAsync<AuthDtos.User>("/api/auth/me");
        me!.AvatarUrl.Should().Be(current.AvatarUrl);
        var image = await _factory.CreateClient().GetAsync(current.AvatarUrl);
        (await image.Content.ReadAsByteArrayAsync()).Should().Equal(Jpeg);
    }

    private record ValidationProblem(Dictionary<string, string[]> Errors);

    [Fact]
    public async Task Replacing_the_photo_issues_a_new_url_and_retires_the_old_one()
    {
        var session = await SignedInClient.CreateAsync(_factory);
        var first = await UploadOk(session.Client, Png, "image/png");

        var second = await UploadOk(session.Client, Webp, "image/webp");

        second.AvatarUrl.Should().NotBeNull().And.NotBe(first.AvatarUrl);
        var anon = _factory.CreateClient();
        (await anon.GetAsync(first.AvatarUrl)).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await anon.GetAsync(second.AvatarUrl)).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Removing_the_photo_clears_the_url_retires_it_and_is_idempotent()
    {
        var session = await SignedInClient.CreateAsync(_factory);
        var uploaded = await UploadOk(session.Client, Png, "image/png");

        var res = await session.Client.DeleteAsync(AvatarRoute);

        res.StatusCode.Should().Be(HttpStatusCode.OK);
        (await res.Content.ReadFromJsonAsync<AuthDtos.User>())!.AvatarUrl.Should().BeNull();
        (await _factory.CreateClient().GetAsync(uploaded.AvatarUrl)).StatusCode
            .Should().Be(HttpStatusCode.NotFound);
        var me = await session.Client.GetFromJsonAsync<AuthDtos.User>("/api/auth/me");
        me!.AvatarUrl.Should().BeNull();

        var again = await session.Client.DeleteAsync(AvatarRoute);
        again.StatusCode.Should().Be(HttpStatusCode.OK);
        (await again.Content.ReadFromJsonAsync<AuthDtos.User>())!.AvatarUrl.Should().BeNull();
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
