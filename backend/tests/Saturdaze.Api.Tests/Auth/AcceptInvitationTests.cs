using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Auth;

/// <summary>An invited member joins the family with their own credentials (L2-127).</summary>
public class AcceptInvitationTests : IClassFixture<SaturdazeApiFactory>
{
    private const string Password = "Passw0rd!";
    private readonly SaturdazeApiFactory _factory;

    public AcceptInvitationTests(SaturdazeApiFactory factory) => _factory = factory;

    [Fact]
    public async Task A_usable_invitation_names_the_family_and_the_invited_email()
    {
        // Traces to: L2-127 #1
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var (email, token) = await Invite(owner);

        var response = await Anonymous().PostAsJsonAsync("/api/auth/invitation", new { Token = token });
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var invitation = JsonDocument.Parse(body).RootElement;
        invitation.GetProperty("email").GetString().Should().Be(email);
        invitation.GetProperty("invitedByEmail").GetString().Should().Be(owner.Email);
        invitation.TryGetProperty("familyName", out _).Should().BeTrue();
    }

    [Fact]
    public async Task Accepting_creates_a_verified_account_in_the_inviting_family()
    {
        // Traces to: L2-127 #2, L2-124 #2, L2-124 #3
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var (email, token) = await Invite(owner);

        var response = await Anonymous().PostAsJsonAsync("/api/auth/accept-invitation", new { Token = token, Password });
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.Created, body);
        var auth = JsonSerializer.Deserialize<AuthDtos.AuthSuccess>(body, Json)!;
        auth.Token.AccessToken.Should().NotBeNullOrWhiteSpace();
        auth.Token.RefreshToken.Should().NotBeNullOrWhiteSpace();
        auth.User.Email.Should().Be(email);
        auth.User.EmailVerifiedUtc.Should().NotBeNull();

        var family = await GetFamily(Bearer(auth.Token.AccessToken));
        family.GetProperty("id").GetGuid().Should().Be(owner.FamilyId!.Value);
        family.GetProperty("isOwner").GetBoolean().Should().BeFalse();
        family.GetProperty("ownerEmail").GetString().Should().Be(owner.Email);
        var sara = family.GetProperty("members").EnumerateArray().Single(m => m.GetProperty("name").GetString() == "Sara");
        sara.GetProperty("access").GetString().Should().Be("Account");
        sara.GetProperty("email").GetString().Should().Be(email);
    }

    [Fact]
    public async Task The_new_member_signs_in_and_sees_the_owners_weekend()
    {
        // Traces to: L2-127 #3
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var (email, token) = await Invite(owner);
        (await Anonymous().PostAsJsonAsync("/api/auth/accept-invitation", new { Token = token, Password }))
            .StatusCode.Should().Be(HttpStatusCode.Created);

        var login = await Anonymous().PostAsJsonAsync("/api/auth/login", new AuthDtos.LoginRequest(email, Password));
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        var member = Bearer((await login.Content.ReadFromJsonAsync<AuthDtos.AuthSuccess>())!.Token.AccessToken);

        var ownersWeekend = await WeekendId(owner.Client);
        (await WeekendId(member)).Should().Be(ownersWeekend);
    }

    [Fact]
    public async Task An_accepted_invitation_cannot_be_used_again()
    {
        // Traces to: L2-127 #4
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var (_, token) = await Invite(owner);
        (await Anonymous().PostAsJsonAsync("/api/auth/accept-invitation", new { Token = token, Password }))
            .StatusCode.Should().Be(HttpStatusCode.Created);

        await ShouldBeRefused("/api/auth/invitation", new { Token = token }, "token_invalid");
        await ShouldBeRefused("/api/auth/accept-invitation", new { Token = token, Password }, "token_invalid");
    }

    [Fact]
    public async Task An_unknown_invitation_is_invalid()
    {
        // Traces to: L2-127 #4
        await ShouldBeRefused("/api/auth/invitation", new { Token = "no-such-token" }, "token_invalid");
        await ShouldBeRefused("/api/auth/accept-invitation", new { Token = "no-such-token", Password }, "token_invalid");
    }

    [Fact]
    public async Task An_expired_invitation_creates_no_account()
    {
        // Traces to: L2-127 #4
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var (email, token) = await Invite(owner);
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var invitation = await db.FamilyInvitations.SingleAsync(i => i.FamilyId == owner.FamilyId);
            invitation.ExpiresAtUtc = _factory.Clock.UtcNow.AddSeconds(-1);
            await db.SaveChangesAsync();
        }

        await ShouldBeRefused("/api/auth/invitation", new { Token = token }, "token_expired");
        await ShouldBeRefused("/api/auth/accept-invitation", new { Token = token, Password }, "token_expired");

        using var check = _factory.Services.CreateScope();
        (await check.ServiceProvider.GetRequiredService<AppDbContext>().Users
            .AnyAsync(u => u.NormalizedEmail == email.ToLowerInvariant())).Should().BeFalse();
    }

    [Fact]
    public async Task A_short_password_leaves_the_invitation_usable()
    {
        // Traces to: L2-127 #5
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var (_, token) = await Invite(owner);

        await ShouldBeRefused("/api/auth/accept-invitation", new { Token = token, Password = "short1!" }, "weak_password");

        (await Anonymous().PostAsJsonAsync("/api/auth/invitation", new { Token = token }))
            .StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    private HttpClient Anonymous() => _factory.CreateClient();

    private HttpClient Bearer(string accessToken)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        return client;
    }

    private static async Task<(string Email, string Token)> Invite(SignedInClient.Session owner)
    {
        var email = $"sara-{Guid.NewGuid():N}@example.com";
        var response = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = "Sara", Age = 36, Email = email });
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.Created, body);
        return (email, JsonDocument.Parse(body).RootElement.GetProperty("invite").GetProperty("token").GetString()!);
    }

    private async Task ShouldBeRefused(string path, object payload, string code)
    {
        var response = await Anonymous().PostAsJsonAsync(path, payload);
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, body);
        JsonSerializer.Deserialize<AuthDtos.Error>(body, Json)!.Code.Should().Be(code);
    }

    private static async Task<JsonElement> GetFamily(HttpClient client)
    {
        var response = await client.GetAsync("/api/family");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        return JsonDocument.Parse(body).RootElement;
    }

    private static async Task<Guid> WeekendId(HttpClient client)
    {
        var response = await client.GetAsync("/api/weekends/current");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        return JsonDocument.Parse(body).RootElement.GetProperty("id").GetGuid();
    }
}
