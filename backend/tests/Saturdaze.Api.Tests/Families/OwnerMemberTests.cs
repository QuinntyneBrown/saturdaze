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

namespace Saturdaze.Api.Tests.Families;

/// <summary>The family owner is a member of "Who's in", linked to their account (L2-214 to L2-218, ADR-024).</summary>
public class OwnerMemberTests : IClassFixture<SaturdazeApiFactory>
{
    private const string Password = "Passw0rd!";
    private readonly SaturdazeApiFactory _factory;

    public OwnerMemberTests(SaturdazeApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Registering_with_a_name_and_age_puts_the_owner_in_whos_in()
    {
        // Traces to: L2-214 #1, L2-215 #1
        var (client, email) = await Register("  Quinn ", 38);

        var family = await GetFamily(client);

        var quinn = Member(family, "Quinn");
        quinn.GetProperty("age").GetInt32().Should().Be(38);
        quinn.GetProperty("access").GetString().Should().Be("Account");
        quinn.GetProperty("email").GetString().Should().Be(email);
        family.GetProperty("members").GetArrayLength().Should().Be(1);
        family.GetProperty("selfMemberId").GetGuid().Should().Be(quinn.GetProperty("id").GetGuid());
    }

    [Fact]
    public async Task An_invited_member_sees_the_owner_in_whos_in()
    {
        // Traces to: L2-214 #2
        var (owner, ownerEmail) = await Register("Quinn", 38);
        var token = await Invite(owner, "Vanessa", NewEmail("vanessa"));
        var vanessa = await Accept(token);

        var family = await GetFamily(vanessa);

        family.GetProperty("isOwner").GetBoolean().Should().BeFalse();
        var quinn = Member(family, "Quinn");
        quinn.GetProperty("access").GetString().Should().Be("Account");
        quinn.GetProperty("email").GetString().Should().Be(ownerEmail);
        family.GetProperty("selfMemberId").GetGuid().Should().Be(Member(family, "Vanessa").GetProperty("id").GetGuid());
    }

    [Fact]
    public async Task Registering_without_a_name_and_age_leaves_the_owner_out()
    {
        // Traces to: L2-214 #3
        var (client, _) = await Register(null, null);

        var family = await GetFamily(client);

        family.GetProperty("members").GetArrayLength().Should().Be(0);
        family.GetProperty("selfMemberId").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Theory]
    [InlineData("Quinn", null)]
    [InlineData(null, 38)]
    [InlineData("", 38)]
    [InlineData("Quinn", -1)]
    [InlineData("Quinn", 121)]
    public async Task An_invalid_owner_name_or_age_is_refused(string? name, int? age)
    {
        // Traces to: L2-215 #2
        var email = NewEmail("owner");

        var response = await _factory.CreateClient().PostAsJsonAsync("/api/auth/register",
            new { Email = email, Password, OwnerName = name, OwnerAge = age });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.Users.AnyAsync(u => u.NormalizedEmail == email)).Should().BeFalse();
    }

    [Fact]
    public async Task An_owner_name_over_100_characters_is_refused()
    {
        // Traces to: L2-215 #2
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/auth/register",
            new { Email = NewEmail("owner"), Password, OwnerName = new string('q', 101), OwnerAge = 38 });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task A_google_owner_still_has_to_add_themselves()
    {
        // Traces to: L2-215 #3
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/auth/google",
            new { Credential = _factory.Google.Issue($"g-{Guid.NewGuid():N}", NewEmail("google")) });
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);

        var family = await GetFamily(Bearer(body));

        family.GetProperty("isOwner").GetBoolean().Should().BeTrue();
        family.GetProperty("members").GetArrayLength().Should().Be(0);
        family.GetProperty("selfMemberId").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task A_platform_invitation_owner_still_has_to_add_themselves()
    {
        // Traces to: L2-215 #4
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var plain = PlatformInvites.TokenOf(await PlatformInvites.SendOneAsync(admin.Client, PlatformInvites.NewEmail("plain")));
        var prospectId = (await Prospects.CreateAsync(admin.Client, Prospects.Riveras(_factory.Clock.Today))).GetProperty("id").GetGuid();
        var sample = PlatformInvites.TokenOf(await PlatformInvites.SendOneAsync(admin.Client, PlatformInvites.NewEmail("dani"), prospectId));

        foreach (var token in new[] { plain, sample })
        {
            var response = await PlatformInvites.AcceptAsync(_factory.CreateClient(), token);
            var body = await response.Content.ReadAsStringAsync();
            response.StatusCode.Should().Be(HttpStatusCode.Created, body);

            var family = await GetFamily(Bearer(body));

            family.GetProperty("isOwner").GetBoolean().Should().BeTrue();
            family.GetProperty("selfMemberId").ValueKind.Should().Be(JsonValueKind.Null);
            family.GetProperty("members").EnumerateArray()
                .Should().NotContain(m => m.GetProperty("access").GetString() == "Account");
        }
    }

    [Fact]
    public async Task The_first_profile_save_owner_still_has_to_add_themselves()
    {
        // Traces to: L2-215 #5
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.None);

        var response = await session.Client.PutAsJsonAsync("/api/family", new { HomeLocation = "Oakville, ON" });
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var family = JsonDocument.Parse(body).RootElement;
        family.GetProperty("isOwner").GetBoolean().Should().BeTrue();
        family.GetProperty("selfMemberId").ValueKind.Should().Be(JsonValueKind.Null);
    }

    // ---- helpers ---------------------------------------------------------

    private async Task<(HttpClient Client, string Email)> Register(string? name, int? age)
    {
        var email = NewEmail("owner");
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/auth/register",
            new { Email = email, Password, FamilyName = "The Browns", OwnerName = name, OwnerAge = age });
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.Created, body);
        return (Bearer(body), email);
    }

    private async Task<HttpClient> Accept(string token)
    {
        var response = await _factory.CreateClient().PostAsJsonAsync("/api/auth/accept-invitation", new { Token = token, Password });
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.Created, body);
        return Bearer(body);
    }

    private HttpClient Bearer(string authSuccess)
    {
        var token = JsonDocument.Parse(authSuccess).RootElement.GetProperty("token").GetProperty("accessToken").GetString();
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static async Task<string> Invite(HttpClient owner, string name, string email)
    {
        var response = await owner.PostAsJsonAsync("/api/family/members", new { Name = name, Age = 36, Email = email });
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.Created, body);
        return JsonDocument.Parse(body).RootElement.GetProperty("invite").GetProperty("token").GetString()!;
    }

    private static string NewEmail(string prefix) => $"{prefix}-{Guid.NewGuid():N}@example.com";

    private static async Task<JsonElement> GetFamily(HttpClient client)
    {
        var response = await client.GetAsync("/api/family");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        return JsonDocument.Parse(body).RootElement;
    }

    private static JsonElement Member(JsonElement family, string name) =>
        family.GetProperty("members").EnumerateArray().Single(m => m.GetProperty("name").GetString() == name);
}
