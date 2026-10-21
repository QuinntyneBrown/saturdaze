// Traces to: L2-163
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Auth;

/// <summary>
/// Sign in with Google: how a verified Google identity maps onto accounts
/// (ADR-019). Google itself is replaced by <see cref="FakeGoogleIdTokenVerifier"/>;
/// the real verifier's rules are covered by its own unit tests.
/// </summary>
public class GoogleSignInTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    public GoogleSignInTests(SaturdazeApiFactory factory) => _factory = factory;

    private record GoogleRequest(string Credential);

    private static string Email(string prefix) => $"{prefix}-{Guid.NewGuid():N}@example.com";

    private Task<HttpResponseMessage> PostAsync(HttpClient client, string credential)
        => client.PostAsJsonAsync("/api/auth/google", new GoogleRequest(credential));

    [Fact]
    public async Task First_google_sign_in_creates_a_verified_account_owning_a_new_family()
    {
        var client = _factory.CreateClient();
        var email = Email("new");
        var credential = _factory.Google.Issue("g-new-1", email);

        var res = await PostAsync(client, credential);

        res.StatusCode.Should().Be(HttpStatusCode.OK, await res.Content.ReadAsStringAsync());
        var body = (await res.Content.ReadFromJsonAsync<AuthDtos.AuthSuccess>())!;
        body.Token.AccessToken.Should().NotBeNullOrEmpty();
        body.Token.RefreshToken.Should().NotBeNullOrEmpty();
        body.User.Email.Should().Be(email);
        body.User.EmailVerifiedUtc.Should().NotBeNull();

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var users = await db.Users.Where(u => u.NormalizedEmail == email.ToLowerInvariant()).ToListAsync();
        users.Should().ContainSingle();
        users[0].GoogleSubject.Should().Be("g-new-1");
        users[0].PasswordHash.Should().BeEmpty();
        var family = await db.Families.SingleAsync(f => f.Id == users[0].FamilyId);
        family.OwnerUserId.Should().Be(users[0].Id);
        _factory.Mail.To(email).Should().BeEmpty("Google already verified the address");
    }

    [Fact]
    public async Task Second_google_sign_in_returns_the_same_account_and_a_new_refresh_token()
    {
        var client = _factory.CreateClient();
        var email = Email("again");
        var credential = _factory.Google.Issue("g-again-1", email);

        var first = (await (await PostAsync(client, credential)).Content.ReadFromJsonAsync<AuthDtos.AuthSuccess>())!;
        var res = await PostAsync(client, credential);

        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var second = (await res.Content.ReadFromJsonAsync<AuthDtos.AuthSuccess>())!;
        second.User.Id.Should().Be(first.User.Id);
        second.Token.RefreshToken.Should().NotBe(first.Token.RefreshToken);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.Users.CountAsync(u => u.NormalizedEmail == email.ToLowerInvariant())).Should().Be(1);
        (await db.Families.CountAsync(f => f.OwnerUserId == first.User.Id)).Should().Be(1);
        (await db.RefreshTokens.CountAsync(t => t.UserId == first.User.Id && t.RevokedAtUtc == null)).Should().Be(2);
    }

    [Fact]
    public async Task Google_links_to_a_verified_password_account_with_the_same_email()
    {
        var client = _factory.CreateClient();
        var email = Email("linked");
        var register = await client.PostAsJsonAsync("/api/auth/register", new AuthDtos.RegisterRequest(email, SignedInClient.Password));
        var account = (await register.Content.ReadFromJsonAsync<AuthDtos.AuthSuccess>())!;
        await MarkVerifiedAsync(account.User.Id);

        var res = await PostAsync(client, _factory.Google.Issue("g-linked-1", email));

        res.StatusCode.Should().Be(HttpStatusCode.OK, await res.Content.ReadAsStringAsync());
        (await res.Content.ReadFromJsonAsync<AuthDtos.AuthSuccess>())!.User.Id.Should().Be(account.User.Id);

        // The password still works.
        var login = await client.PostAsJsonAsync("/api/auth/login", new AuthDtos.LoginRequest(email, SignedInClient.Password));
        login.StatusCode.Should().Be(HttpStatusCode.OK);

        // From now on the subject, not the email, identifies the account.
        var renamed = await PostAsync(client, _factory.Google.Issue("g-linked-1", Email("renamed")));
        renamed.StatusCode.Should().Be(HttpStatusCode.OK);
        (await renamed.Content.ReadFromJsonAsync<AuthDtos.AuthSuccess>())!.User.Id.Should().Be(account.User.Id);
    }

    [Fact]
    public async Task Google_refuses_an_unverified_password_account_with_the_same_email()
    {
        var client = _factory.CreateClient();
        var email = Email("pending");
        var register = await client.PostAsJsonAsync("/api/auth/register", new AuthDtos.RegisterRequest(email, SignedInClient.Password));
        var account = (await register.Content.ReadFromJsonAsync<AuthDtos.AuthSuccess>())!;

        var res = await PostAsync(client, _factory.Google.Issue("g-pending-1", email));

        res.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await res.Content.ReadFromJsonAsync<AuthDtos.Error>())!.Code.Should().Be("email_unverified");

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.Users.SingleAsync(u => u.Id == account.User.Id)).GoogleSubject.Should().BeNull();
        (await db.Users.CountAsync(u => u.NormalizedEmail == email.ToLowerInvariant())).Should().Be(1);
        (await db.Users.AnyAsync(u => u.GoogleSubject == "g-pending-1")).Should().BeFalse();
    }

    [Fact]
    public async Task A_credential_the_verifier_refuses_is_401_and_creates_nothing()
    {
        var client = _factory.CreateClient();

        var res = await PostAsync(client, "not-a-google-credential");

        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await res.Content.ReadFromJsonAsync<AuthDtos.Error>())!.Code.Should().Be("google_token_invalid");
    }

    [Fact]
    public async Task A_google_email_google_has_not_verified_is_401_and_creates_nothing()
    {
        var client = _factory.CreateClient();
        var email = Email("unverified");

        var res = await PostAsync(client, _factory.Google.Issue("g-unverified-1", email, emailVerified: false));

        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await res.Content.ReadFromJsonAsync<AuthDtos.Error>())!.Code.Should().Be("google_email_unverified");

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.Users.AnyAsync(u => u.NormalizedEmail == email.ToLowerInvariant())).Should().BeFalse();
    }

    [Fact]
    public async Task A_google_created_account_has_no_password_sign_in()
    {
        var client = _factory.CreateClient();
        var email = Email("nopw");
        (await PostAsync(client, _factory.Google.Issue("g-nopw-1", email))).EnsureSuccessStatusCode();

        var login = await client.PostAsJsonAsync("/api/auth/login", new AuthDtos.LoginRequest(email, "anything-at-all"));

        login.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await login.Content.ReadFromJsonAsync<AuthDtos.Error>())!.Code.Should().Be("invalid_credentials");
    }

    [Fact]
    public async Task An_empty_credential_fails_validation()
    {
        var res = await PostAsync(_factory.CreateClient(), "");

        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await res.Content.ReadAsStringAsync()).Should().ContainEquivalentOf("credential");
    }

    [Fact]
    public async Task Without_a_client_id_the_endpoint_is_503()
    {
        _factory.Google.IsConfigured = false;
        try
        {
            var res = await PostAsync(_factory.CreateClient(), _factory.Google.Issue("g-off-1", Email("off")));
            res.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
            (await res.Content.ReadFromJsonAsync<AuthDtos.Error>())!.Code.Should().Be("google_not_configured");
        }
        finally
        {
            _factory.Google.IsConfigured = true;
        }
    }

    [Fact]
    public async Task The_issued_access_token_passes_a_protected_endpoint()
    {
        var client = _factory.CreateClient();
        var body = (await (await PostAsync(client, _factory.Google.Issue("g-me-1", Email("me")))).Content
            .ReadFromJsonAsync<AuthDtos.AuthSuccess>())!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", body.Token.AccessToken);

        var me = await client.GetAsync("/api/auth/me");

        me.StatusCode.Should().Be(HttpStatusCode.OK);
        (await me.Content.ReadFromJsonAsync<AuthDtos.User>())!.Id.Should().Be(body.User.Id);
    }

    private async Task MarkVerifiedAsync(Guid userId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = await db.Users.SingleAsync(u => u.Id == userId);
        user.EmailVerifiedUtc = _factory.Clock.UtcNow;
        await db.SaveChangesAsync();
    }
}
