// Traces to: L2-161
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Auth;

/// <summary>An invited person opens the join link and creates their account (L2-161).</summary>
public class JoinTests : IClassFixture<SaturdazeApiFactory>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private readonly SaturdazeApiFactory _factory;
    public JoinTests(SaturdazeApiFactory factory) => _factory = factory;

    [Fact]
    public async Task A_plain_invitation_previews_without_a_sample()
    {
        // Traces to: L2-161 #2
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var email = PlatformInvites.NewEmail("plain");
        var invitation = await PlatformInvites.SendOneAsync(admin.Client, email);

        var response = await PlatformInvites.PreviewAsync(_factory.CreateClient(), PlatformInvites.TokenOf(invitation));
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var preview = JsonDocument.Parse(body).RootElement;
        preview.GetProperty("email").GetString().Should().Be(email);
        preview.GetProperty("invitedByEmail").GetString().Should().Be(admin.Email);
        preview.GetProperty("familyName").ValueKind.Should().Be(JsonValueKind.Null);
        preview.GetProperty("sample").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task Accepting_a_plain_invitation_creates_a_verified_owner_of_an_empty_family()
    {
        // Traces to: L2-161 #4
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var email = PlatformInvites.NewEmail("owner");
        var token = PlatformInvites.TokenOf(await PlatformInvites.SendOneAsync(admin.Client, email));

        var response = await PlatformInvites.AcceptAsync(_factory.CreateClient(), token);
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.Created, body);
        var auth = JsonSerializer.Deserialize<AuthDtos.AuthSuccess>(body, Json)!;
        auth.Token.AccessToken.Should().NotBeNullOrWhiteSpace();
        auth.User.Email.Should().Be(email);
        auth.User.EmailVerifiedUtc.Should().NotBeNull();

        var family = await GetFamily(Bearer(auth.Token.AccessToken));
        family.GetProperty("isOwner").GetBoolean().Should().BeTrue();
        family.GetProperty("ownerEmail").GetString().Should().Be(email);
        family.GetProperty("members").GetArrayLength().Should().Be(0);

        var login = await _factory.CreateClient().PostAsJsonAsync("/api/auth/login", new AuthDtos.LoginRequest(email, PlatformInvites.Password));
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        (await _factory.Mail.WaitForAsync(email, count: 2, timeoutMs: 500)).Should().HaveCount(1, "no verification mail follows a join");
    }

    [Fact]
    public async Task Unusable_tokens_are_refused_and_create_no_account()
    {
        // Traces to: L2-161 #6
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var anonymous = _factory.CreateClient();

        await ShouldBeRefused(anonymous, "/api/auth/join", new { Token = "no-such-token" }, "token_invalid");
        await ShouldBeRefused(anonymous, "/api/auth/join/accept", new { Token = "no-such-token", Password = PlatformInvites.Password }, "token_invalid");

        var used = PlatformInvites.TokenOf(await PlatformInvites.SendOneAsync(admin.Client, PlatformInvites.NewEmail("used")));
        (await PlatformInvites.AcceptAsync(anonymous, used)).StatusCode.Should().Be(HttpStatusCode.Created);
        await ShouldBeRefused(anonymous, "/api/auth/join", new { Token = used }, "token_invalid");
        await ShouldBeRefused(anonymous, "/api/auth/join/accept", new { Token = used, Password = PlatformInvites.Password }, "token_invalid");

        var expiredEmail = PlatformInvites.NewEmail("expired");
        var expired = PlatformInvites.TokenOf(await PlatformInvites.SendOneAsync(admin.Client, expiredEmail));
        var start = _factory.Clock.Today;
        try
        {
            _factory.Clock.Today = start.AddDays(15);
            await ShouldBeRefused(anonymous, "/api/auth/join", new { Token = expired }, "token_expired");
            await ShouldBeRefused(anonymous, "/api/auth/join/accept", new { Token = expired, Password = PlatformInvites.Password }, "token_expired");
        }
        finally
        {
            _factory.Clock.Today = start;
        }
        using var scope = _factory.Services.CreateScope();
        (await scope.ServiceProvider.GetRequiredService<AppDbContext>().Users
            .AnyAsync(u => u.NormalizedEmail == expiredEmail.ToLowerInvariant())).Should().BeFalse();
    }

    [Fact]
    public async Task A_short_password_leaves_the_invitation_usable()
    {
        // Traces to: L2-161 #6
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var anonymous = _factory.CreateClient();
        var token = PlatformInvites.TokenOf(await PlatformInvites.SendOneAsync(admin.Client, PlatformInvites.NewEmail("short")));

        await ShouldBeRefused(anonymous, "/api/auth/join/accept", new { Token = token, Password = "short1!" }, "weak_password");

        (await PlatformInvites.PreviewAsync(anonymous, token)).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task An_invitation_with_a_sample_previews_the_weekend_as_a_share_viewer_sees_it()
    {
        // Traces to: L2-161 #1
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var prospect = await Prospects.CreateAsync(admin.Client, Prospects.Riveras(_factory.Clock.Today));
        var email = PlatformInvites.NewEmail("sample");
        var invitation = await PlatformInvites.SendOneAsync(admin.Client, email, prospect.GetProperty("id").GetGuid());
        invitation.GetProperty("sampleWeekend").GetProperty("familyName").GetString().Should().Be("The Riveras");

        var response = await PlatformInvites.PreviewAsync(_factory.CreateClient(), PlatformInvites.TokenOf(invitation));
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var preview = JsonDocument.Parse(body).RootElement;
        preview.GetProperty("email").GetString().Should().Be(email);
        preview.GetProperty("invitedByEmail").GetString().Should().Be(admin.Email);
        preview.GetProperty("familyName").GetString().Should().Be("The Riveras");
        var sample = preview.GetProperty("sample");
        sample.GetProperty("weekendOf").GetString().Should().Be(prospect.GetProperty("weekendOf").GetString());
        sample.GetProperty("blocks").GetArrayLength().Should().BeGreaterThan(0);
        sample.TryGetProperty("errands", out _).Should().BeFalse();
        sample.TryGetProperty("notes", out _).Should().BeFalse();
        sample.TryGetProperty("home", out _).Should().BeFalse();
    }

    [Fact]
    public async Task Accepting_a_sample_invitation_claims_the_family_and_its_weekend()
    {
        // Traces to: L2-161 #3
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var prospect = await Prospects.CreateAsync(admin.Client, Prospects.Riveras(_factory.Clock.Today));
        var prospectId = prospect.GetProperty("id").GetGuid();
        var weekendId = prospect.GetProperty("weekend").GetProperty("id").GetGuid();
        var email = PlatformInvites.NewEmail("claim");
        var token = PlatformInvites.TokenOf(await PlatformInvites.SendOneAsync(admin.Client, email, prospectId));

        var response = await PlatformInvites.AcceptAsync(_factory.CreateClient(), token);
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.Created, body);
        var auth = JsonSerializer.Deserialize<AuthDtos.AuthSuccess>(body, Json)!;
        auth.User.EmailVerifiedUtc.Should().NotBeNull();
        var me = Bearer(auth.Token.AccessToken);

        var family = await GetFamily(me);
        family.GetProperty("isOwner").GetBoolean().Should().BeTrue();
        family.GetProperty("name").GetString().Should().Be("The Riveras");
        family.GetProperty("members").EnumerateArray().Select(m => m.GetProperty("name").GetString()).Should().BeEquivalentTo(new[] { "Dani", "Mateo" });

        var weekend = await me.GetAsync($"/api/weekends/{weekendId}");
        weekend.StatusCode.Should().Be(HttpStatusCode.OK, await weekend.Content.ReadAsStringAsync());

        (await Prospects.GetAsync(admin.Client, prospectId)).GetProperty("status").GetString().Should().Be("Claimed");
        PlatformInvites.Row(await PlatformInvites.ListAsync(admin.Client), email).GetProperty("status").GetString().Should().Be("Accepted");
    }

    [Fact]
    public async Task A_second_invitee_joins_the_claimed_family_as_a_member()
    {
        // Traces to: L2-161 #5
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var prospectId = (await Prospects.CreateAsync(admin.Client, Prospects.Riveras(_factory.Clock.Today))).GetProperty("id").GetGuid();
        var (first, second) = (PlatformInvites.NewEmail("first"), PlatformInvites.NewEmail("second"));
        var invitations = await PlatformInvites.SendAsync(admin.Client, prospectId, null, first, second);
        var anonymous = _factory.CreateClient();

        var owner = JsonSerializer.Deserialize<AuthDtos.AuthSuccess>(
            await (await PlatformInvites.AcceptAsync(anonymous, PlatformInvites.TokenOf(invitations[0]))).Content.ReadAsStringAsync(), Json)!;
        var memberResponse = await PlatformInvites.AcceptAsync(anonymous, PlatformInvites.TokenOf(invitations[1]));
        memberResponse.StatusCode.Should().Be(HttpStatusCode.Created, await memberResponse.Content.ReadAsStringAsync());
        var member = JsonSerializer.Deserialize<AuthDtos.AuthSuccess>(await memberResponse.Content.ReadAsStringAsync(), Json)!;

        var ownersFamily = await GetFamily(Bearer(owner.Token.AccessToken));
        var membersFamily = await GetFamily(Bearer(member.Token.AccessToken));
        membersFamily.GetProperty("id").GetGuid().Should().Be(ownersFamily.GetProperty("id").GetGuid());
        membersFamily.GetProperty("isOwner").GetBoolean().Should().BeFalse();
        membersFamily.GetProperty("ownerEmail").GetString().Should().Be(first);
    }

    private HttpClient Bearer(string accessToken)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        return client;
    }

    private static async Task ShouldBeRefused(HttpClient client, string path, object payload, string code)
    {
        var response = await client.PostAsJsonAsync(path, payload);
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, body);
        JsonSerializer.Deserialize<AuthDtos.Error>(body, Json)!.Code.Should().Be(code);
    }

    internal static async Task<JsonElement> GetFamily(HttpClient client)
    {
        var response = await client.GetAsync("/api/family");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        return JsonDocument.Parse(body).RootElement;
    }
}
