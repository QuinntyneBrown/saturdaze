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
    private record ForgotPasswordRequest(string Email);
    private record ResetPasswordRequest(string Token, string Password);
    private record VerifyEmailRequest(string Token);
    private record ResendVerificationRequest(string Email);
    private record DeliveryDto(string? Email, string? Token, DateTimeOffset? ExpiresAtUtc);
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

    [Fact]
    public async Task Forgot_password_returns_202_for_known_and_unknown_email()
    {
        var client = _factory.CreateClient();
        var email = $"forgot-{Guid.NewGuid():N}@example.com";

        await client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(email, "password123", null, null));

        var known = await client.PostAsJsonAsync("/api/auth/forgot-password",
            new ForgotPasswordRequest(email));
        var unknown = await client.PostAsJsonAsync("/api/auth/forgot-password",
            new ForgotPasswordRequest($"missing-{Guid.NewGuid():N}@example.com"));

        known.StatusCode.Should().Be(HttpStatusCode.Accepted);
        unknown.StatusCode.Should().Be(HttpStatusCode.Accepted);

        var body = await known.Content.ReadFromJsonAsync<DeliveryDto>();
        body!.Token.Should().NotBeNullOrWhiteSpace();
        body.ExpiresAtUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task Reset_password_with_valid_token_consumes_token_and_changes_password()
    {
        var client = _factory.CreateClient();
        var email = $"reset-{Guid.NewGuid():N}@example.com";

        await client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(email, "password123", null, null));
        var forgot = await client.PostAsJsonAsync("/api/auth/forgot-password",
            new ForgotPasswordRequest(email));
        var delivery = await forgot.Content.ReadFromJsonAsync<DeliveryDto>();

        var reset = await client.PostAsJsonAsync("/api/auth/reset-password",
            new ResetPasswordRequest(delivery!.Token!, "newpass123"));
        reset.StatusCode.Should().Be(HttpStatusCode.OK);

        var oldLogin = await client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest(email, "password123"));
        oldLogin.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var newLogin = await client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest(email, "newpass123"));
        newLogin.StatusCode.Should().Be(HttpStatusCode.OK);

        var reuse = await client.PostAsJsonAsync("/api/auth/reset-password",
            new ResetPasswordRequest(delivery.Token!, "anotherpass123"));
        reuse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var err = await reuse.Content.ReadFromJsonAsync<AuthError>();
        err!.Code.Should().Be("token_invalid");
    }

    [Fact]
    public async Task Verify_email_sets_email_verified_timestamp()
    {
        var client = _factory.CreateClient();
        var email = $"verify-{Guid.NewGuid():N}@example.com";

        var reg = await client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(email, "password123", null, null));
        var auth = await reg.Content.ReadFromJsonAsync<AuthSuccessDto>();

        var resend = await client.PostAsJsonAsync("/api/auth/resend-verification",
            new ResendVerificationRequest(email));
        resend.StatusCode.Should().Be(HttpStatusCode.Accepted);
        var delivery = await resend.Content.ReadFromJsonAsync<DeliveryDto>();
        delivery!.Token.Should().NotBeNullOrWhiteSpace();

        var verify = await client.PostAsJsonAsync("/api/auth/verify-email",
            new VerifyEmailRequest(delivery.Token!));
        verify.StatusCode.Should().Be(HttpStatusCode.OK);

        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", auth!.Token.AccessToken);
        var me = await client.GetFromJsonAsync<UserDto>("/api/auth/me");
        me!.EmailVerifiedUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task Verify_email_with_bad_token_returns_400_token_invalid()
    {
        var client = _factory.CreateClient();
        var verify = await client.PostAsJsonAsync("/api/auth/verify-email",
            new VerifyEmailRequest("not-a-real-token"));
        verify.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var err = await verify.Content.ReadFromJsonAsync<AuthError>();
        err!.Code.Should().Be("token_invalid");
    }
}
