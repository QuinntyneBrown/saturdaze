// Traces to: L2-002, L2-003, L2-033
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
/// Refresh-token rotation and revocation. Every date on the refresh path comes
/// from the fake <c>IDateTimeProvider</c>, so each test pins <c>Clock.Today</c>
/// before it issues a token.
/// </summary>
public class RefreshTokenTests : IClassFixture<SaturdazeApiFactory>
{
    private static readonly DateOnly Issued = new(2026, 5, 16);

    private readonly SaturdazeApiFactory _factory;
    public RefreshTokenTests(SaturdazeApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Refresh_rotates_the_pair_and_links_the_old_token_to_the_new_one()
    {
        _factory.Clock.Today = Issued;
        var client = _factory.CreateClient();
        var first = await RegisterAsync(client);

        var res = await client.PostAsJsonAsync("/api/auth/refresh", new AuthDtos.RefreshRequest(first.Token.RefreshToken));
        res.StatusCode.Should().Be(HttpStatusCode.OK, await res.Content.ReadAsStringAsync());
        var second = (await res.Content.ReadFromJsonAsync<AuthDtos.AuthSuccess>())!;

        second.Token.AccessToken.Should().NotBe(first.Token.AccessToken);
        second.Token.RefreshToken.Should().NotBe(first.Token.RefreshToken);
        second.User.Email.Should().Be(first.User.Email);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var rows = await db.RefreshTokens.Where(t => t.UserId == first.User.Id).ToListAsync();
        rows.Should().HaveCount(2);
        // The fake clock stamps both rows with the same instant, so identify
        // them by revocation state rather than by CreatedAtUtc.
        var old = rows.Single(r => r.RevokedAtUtc is not null);
        var fresh = rows.Single(r => r.RevokedAtUtc is null);
        old.ReplacedByTokenId.Should().Be(fresh.Id);
        fresh.ReplacedByTokenId.Should().BeNull();
        fresh.ExpiresAtUtc.Should().Be(_factory.Clock.UtcNow.AddDays(14));
    }

    [Fact]
    public async Task Refreshed_access_token_is_accepted_by_a_protected_endpoint()
    {
        _factory.Clock.Today = Issued;
        var client = _factory.CreateClient();
        var first = await RegisterAsync(client);

        var res = await client.PostAsJsonAsync("/api/auth/refresh", new AuthDtos.RefreshRequest(first.Token.RefreshToken));
        var second = (await res.Content.ReadFromJsonAsync<AuthDtos.AuthSuccess>())!;

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", second.Token.AccessToken);
        var me = await client.GetAsync("/api/auth/me");
        me.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Reusing_a_rotated_refresh_token_returns_401_revoked()
    {
        _factory.Clock.Today = Issued;
        var client = _factory.CreateClient();
        var first = await RegisterAsync(client);

        (await client.PostAsJsonAsync("/api/auth/refresh", new AuthDtos.RefreshRequest(first.Token.RefreshToken)))
            .EnsureSuccessStatusCode();

        var reuse = await client.PostAsJsonAsync("/api/auth/refresh", new AuthDtos.RefreshRequest(first.Token.RefreshToken));
        reuse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await reuse.Content.ReadFromJsonAsync<AuthDtos.Error>())!.Code.Should().Be("refresh_token_revoked");
    }

    [Fact]
    public async Task Refresh_after_fourteen_days_returns_401_expired()
    {
        _factory.Clock.Today = Issued;
        var client = _factory.CreateClient();
        var first = await RegisterAsync(client);

        _factory.Clock.Today = Issued.AddDays(15);
        var res = await client.PostAsJsonAsync("/api/auth/refresh", new AuthDtos.RefreshRequest(first.Token.RefreshToken));
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await res.Content.ReadFromJsonAsync<AuthDtos.Error>())!.Code.Should().Be("refresh_token_expired");
    }

    [Fact]
    public async Task Refresh_with_unknown_token_returns_401_and_empty_token_returns_400()
    {
        var client = _factory.CreateClient();

        var unknown = await client.PostAsJsonAsync("/api/auth/refresh", new AuthDtos.RefreshRequest("not-a-token"));
        unknown.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await unknown.Content.ReadFromJsonAsync<AuthDtos.Error>())!.Code.Should().Be("refresh_token_invalid");

        var empty = await client.PostAsJsonAsync("/api/auth/refresh", new AuthDtos.RefreshRequest(""));
        empty.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Logout_revokes_the_token_and_blocks_a_later_refresh()
    {
        _factory.Clock.Today = Issued;
        var client = _factory.CreateClient();
        var session = await RegisterAsync(client);

        var logout = await client.PostAsJsonAsync("/api/auth/logout", new AuthDtos.LogoutRequest(session.Token.RefreshToken));
        logout.StatusCode.Should().Be(HttpStatusCode.NoContent);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var row = await db.RefreshTokens.SingleAsync(t => t.UserId == session.User.Id);
            row.RevokedAtUtc.Should().NotBeNull();
        }

        var refresh = await client.PostAsJsonAsync("/api/auth/refresh", new AuthDtos.RefreshRequest(session.Token.RefreshToken));
        refresh.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await refresh.Content.ReadFromJsonAsync<AuthDtos.Error>())!.Code.Should().Be("refresh_token_revoked");
    }

    [Fact]
    public async Task Logout_is_idempotent_and_needs_no_bearer()
    {
        _factory.Clock.Today = Issued;
        var anon = _factory.CreateClient();
        var session = await RegisterAsync(anon);

        var first = await anon.PostAsJsonAsync("/api/auth/logout", new AuthDtos.LogoutRequest(session.Token.RefreshToken));
        var second = await anon.PostAsJsonAsync("/api/auth/logout", new AuthDtos.LogoutRequest(session.Token.RefreshToken));
        var unknown = await anon.PostAsJsonAsync("/api/auth/logout", new AuthDtos.LogoutRequest("never-issued"));

        first.StatusCode.Should().Be(HttpStatusCode.NoContent);
        second.StatusCode.Should().Be(HttpStatusCode.NoContent);
        unknown.StatusCode.Should().Be(HttpStatusCode.NoContent);
    }

    [Fact]
    public async Task Logout_with_a_bearer_ignores_another_users_refresh_token()
    {
        _factory.Clock.Today = Issued;
        var alice = await RegisterAsync(_factory.CreateClient());
        var bob = await RegisterAsync(_factory.CreateClient());

        var aliceClient = _factory.CreateClient();
        aliceClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", alice.Token.AccessToken);

        var res = await aliceClient.PostAsJsonAsync("/api/auth/logout", new AuthDtos.LogoutRequest(bob.Token.RefreshToken));
        res.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Bob's session is untouched.
        var bobRefresh = await _factory.CreateClient()
            .PostAsJsonAsync("/api/auth/refresh", new AuthDtos.RefreshRequest(bob.Token.RefreshToken));
        bobRefresh.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Login_twice_keeps_both_refresh_tokens_alive()
    {
        // L2-033 AC1 permits multiple concurrent sessions per user.
        _factory.Clock.Today = Issued;
        var client = _factory.CreateClient();
        var registered = await RegisterAsync(client);

        var login1 = await LoginAsync(client, registered.User.Email);
        var login2 = await LoginAsync(client, registered.User.Email);

        (await client.PostAsJsonAsync("/api/auth/refresh", new AuthDtos.RefreshRequest(login1.Token.RefreshToken)))
            .StatusCode.Should().Be(HttpStatusCode.OK);
        (await client.PostAsJsonAsync("/api/auth/refresh", new AuthDtos.RefreshRequest(login2.Token.RefreshToken)))
            .StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private static async Task<AuthDtos.AuthSuccess> RegisterAsync(HttpClient client)
    {
        var email = $"refresh-{Guid.NewGuid():N}@example.com";
        var res = await client.PostAsJsonAsync("/api/auth/register", new AuthDtos.RegisterRequest(email, "password123"));
        res.EnsureSuccessStatusCode();
        return (await res.Content.ReadFromJsonAsync<AuthDtos.AuthSuccess>())!;
    }

    private static async Task<AuthDtos.AuthSuccess> LoginAsync(HttpClient client, string email)
    {
        var res = await client.PostAsJsonAsync("/api/auth/login", new AuthDtos.LoginRequest(email, "password123"));
        res.EnsureSuccessStatusCode();
        return (await res.Content.ReadFromJsonAsync<AuthDtos.AuthSuccess>())!;
    }
}
