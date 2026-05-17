using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Xunit;

namespace Saturdaze.Api.Tests.Auth;

public class AuthControllerTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    public AuthControllerTests(SaturdazeApiFactory factory) { _factory = factory; }

    private record RegisterRequest(string Email, string Password, string? FamilyName, string? HomeLocation);
    private record LoginRequest(string Email, string Password);
    private record TokenDto(string AccessToken, string RefreshToken, DateTimeOffset AccessTokenExpiresAtUtc, string TokenType);
    private record UserDto(Guid Id, string Email, string Role, DateTimeOffset? EmailVerifiedUtc);
    private record AuthSuccessDto(TokenDto Token, UserDto User);
    private record AuthError(string Code, string Message);

    [Fact]
    public async Task Register_creates_user_and_returns_tokens()
    {
        var client = _factory.CreateClient();
        var email = $"fresh-{Guid.NewGuid():N}@example.com";

        var res = await client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(email, "password123", "The Browns", "Port Credit"));

        res.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await res.Content.ReadFromJsonAsync<AuthSuccessDto>();
        body.Should().NotBeNull();
        body!.User.Email.Should().Be(email);
        body.Token.AccessToken.Should().NotBeNullOrEmpty();
        body.Token.RefreshToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Register_with_duplicate_email_returns_409_email_in_use()
    {
        var client = _factory.CreateClient();
        var email = $"dup-{Guid.NewGuid():N}@example.com";

        var first = await client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(email, "password123", null, null));
        first.StatusCode.Should().Be(HttpStatusCode.Created);

        var second = await client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(email, "password123", null, null));
        second.StatusCode.Should().Be(HttpStatusCode.Conflict);

        var err = await second.Content.ReadFromJsonAsync<AuthError>();
        err.Should().NotBeNull();
        err!.Code.Should().Be("email_in_use");
    }

    [Fact]
    public async Task Login_with_correct_credentials_returns_200()
    {
        var client = _factory.CreateClient();
        var email = $"login-{Guid.NewGuid():N}@example.com";

        await client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(email, "password123", null, null));

        var login = await client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest(email, "password123"));
        login.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Login_with_wrong_password_returns_401_invalid_credentials()
    {
        var client = _factory.CreateClient();
        var email = $"badpw-{Guid.NewGuid():N}@example.com";

        await client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(email, "password123", null, null));

        var login = await client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest(email, "wrong-password"));
        login.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var err = await login.Content.ReadFromJsonAsync<AuthError>();
        err.Should().NotBeNull();
        err!.Code.Should().Be("invalid_credentials");
    }

    [Fact]
    public async Task Login_with_unknown_email_returns_401_invalid_credentials()
    {
        var client = _factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest($"nobody-{Guid.NewGuid():N}@example.com", "any-password"));
        login.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_without_bearer_returns_401()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync("/api/auth/me");
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_with_bearer_returns_current_user()
    {
        var client = _factory.CreateClient();
        var email = $"me-{Guid.NewGuid():N}@example.com";

        var reg = await client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(email, "password123", null, null));
        var body = await reg.Content.ReadFromJsonAsync<AuthSuccessDto>();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", body!.Token.AccessToken);

        var me = await client.GetAsync("/api/auth/me");
        me.StatusCode.Should().Be(HttpStatusCode.OK);
        var user = await me.Content.ReadFromJsonAsync<UserDto>();
        user!.Email.Should().Be(email);
    }
}
