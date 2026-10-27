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

    [Fact]
    public async Task The_owner_adds_themselves()
    {
        // Traces to: L2-216 #1
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var response = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = "Quinn", Age = 38, Self = true });
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.Created, body);
        var result = JsonDocument.Parse(body).RootElement;
        result.GetProperty("member").GetProperty("access").GetString().Should().Be("Account");
        result.GetProperty("member").GetProperty("email").GetString().Should().Be(owner.Email);
        result.GetProperty("invite").ValueKind.Should().Be(JsonValueKind.Null);
        var family = await GetFamily(owner.Client);
        family.GetProperty("selfMemberId").GetGuid().Should().Be(result.GetProperty("member").GetProperty("id").GetGuid());
        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.FamilyInvitations.AnyAsync(i => i.FamilyId == owner.FamilyId)).Should().BeFalse();
        _factory.Mail.To(owner.Email).Should().NotContain(m => m.Subject.Contains("invited you"));
    }

    [Fact]
    public async Task The_owner_claims_a_listed_member()
    {
        // Traces to: L2-216 #2
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var quinnId = await Add(owner.Client, new { Name = "Quinn", Age = 38 });

        var response = await owner.Client.PostAsync($"/api/family/members/{quinnId}/claim", null);
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var member = JsonDocument.Parse(body).RootElement;
        member.GetProperty("id").GetGuid().Should().Be(quinnId);
        member.GetProperty("access").GetString().Should().Be("Account");
        member.GetProperty("email").GetString().Should().Be(owner.Email);
        (await GetFamily(owner.Client)).GetProperty("selfMemberId").GetGuid().Should().Be(quinnId);
    }

    [Fact]
    public async Task Only_the_owner_says_this_is_me()
    {
        // Traces to: L2-216 #3
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var maeId = await Add(owner.Client, new { Name = "Mae", Age = 5 });
        var other = await SignedInClient.JoinAsync(_factory, owner.FamilyId!.Value);

        var add = await other.Client.PostAsJsonAsync("/api/family/members", new { Name = "Sam", Age = 40, Self = true });
        var claim = await other.Client.PostAsync($"/api/family/members/{maeId}/claim", null);

        add.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await Code(add)).Should().Be("owner_only");
        claim.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await Code(claim)).Should().Be("owner_only");
        var family = await GetFamily(owner.Client);
        family.GetProperty("members").GetArrayLength().Should().Be(1);
        Member(family, "Mae").GetProperty("access").GetString().Should().Be("None");
    }

    [Fact]
    public async Task A_member_of_another_family_cannot_be_claimed()
    {
        // Traces to: L2-216 #4
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var neighbour = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var theirs = await Add(neighbour.Client, new { Name = "Mae", Age = 5 });

        (await owner.Client.PostAsync($"/api/family/members/{theirs}/claim", null)).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await owner.Client.PostAsync($"/api/family/members/{Guid.NewGuid()}/claim", null)).StatusCode.Should().Be(HttpStatusCode.NotFound);
        Member(await GetFamily(neighbour.Client), "Mae").GetProperty("access").GetString().Should().Be("None");
    }

    [Fact]
    public async Task A_member_who_is_invited_or_signs_in_cannot_be_claimed()
    {
        // Traces to: L2-216 #5
        var (owner, _) = await Register(null, null);
        await Invite(owner, "Sara", NewEmail("sara"));
        var vanessaToken = await Invite(owner, "Vanessa", NewEmail("vanessa"));
        await Accept(vanessaToken);
        var family = await GetFamily(owner);

        foreach (var name in new[] { "Sara", "Vanessa" })
        {
            var response = await owner.PostAsync($"/api/family/members/{Member(family, name).GetProperty("id").GetGuid()}/claim", null);
            response.StatusCode.Should().Be(HttpStatusCode.Conflict);
            (await Code(response)).Should().Be("member_has_access");
        }
        (await GetFamily(owner)).GetProperty("selfMemberId").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task An_owner_already_in_whos_in_cannot_add_or_claim_again()
    {
        // Traces to: L2-216 #6
        var (owner, _) = await Register("Quinn", 38);
        var maeId = await Add(owner, new { Name = "Mae", Age = 5 });

        var add = await owner.PostAsJsonAsync("/api/family/members", new { Name = "Q", Age = 38, Self = true });
        var claim = await owner.PostAsync($"/api/family/members/{maeId}/claim", null);

        add.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await Code(add)).Should().Be("already_in_family");
        claim.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await Code(claim)).Should().Be("already_in_family");
        var family = await GetFamily(owner);
        family.GetProperty("members").GetArrayLength().Should().Be(2);
        Member(family, "Mae").GetProperty("access").GetString().Should().Be("None");
    }

    [Fact]
    public async Task Adding_yourself_takes_no_email_and_a_free_name()
    {
        // Traces to: L2-216 #7
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        await Add(owner.Client, new { Name = "Quinn", Age = 38 });

        var withEmail = await owner.Client.PostAsJsonAsync("/api/family/members",
            new { Name = "Q", Age = 38, Self = true, Email = NewEmail("q") });
        var takenName = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = "quinn", Age = 38, Self = true });

        withEmail.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        takenName.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await Code(takenName)).Should().Be("member_name_in_use");
        (await GetFamily(owner.Client)).GetProperty("selfMemberId").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task Nobody_removes_the_owners_own_row()
    {
        // Traces to: L2-218 #1
        var (owner, ownerEmail) = await Register("Quinn", 38);
        var family = await GetFamily(owner);
        var quinnId = family.GetProperty("selfMemberId").GetGuid();
        var vanessa = await Accept(await Invite(owner, "Vanessa", NewEmail("vanessa")));

        var byOwner = await owner.DeleteAsync($"/api/family/members/{quinnId}");
        var byMember = await vanessa.DeleteAsync($"/api/family/members/{quinnId}");

        byOwner.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await Code(byOwner)).Should().Be("cannot_remove_owner");
        byMember.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await Code(byMember)).Should().Be("owner_only");
        Member(await GetFamily(owner), "Quinn").GetProperty("email").GetString().Should().Be(ownerEmail);
    }

    [Fact]
    public async Task The_owner_renames_and_re_ages_their_own_row_through_the_profile_save()
    {
        // Traces to: L2-218 #2, L2-129 #4
        var (owner, ownerEmail) = await Register("Quinn", 38);
        var quinnId = (await GetFamily(owner)).GetProperty("selfMemberId").GetGuid();

        var response = await owner.PutAsJsonAsync("/api/family", new { Members = new[] { new { Id = quinnId, Name = "Quinny", Age = 39 } } });

        response.StatusCode.Should().Be(HttpStatusCode.OK, await response.Content.ReadAsStringAsync());
        var family = await GetFamily(owner);
        var quinny = Member(family, "Quinny");
        quinny.GetProperty("id").GetGuid().Should().Be(quinnId);
        quinny.GetProperty("age").GetInt32().Should().Be(39);
        quinny.GetProperty("access").GetString().Should().Be("Account");
        quinny.GetProperty("email").GetString().Should().Be(ownerEmail);
        family.GetProperty("selfMemberId").GetGuid().Should().Be(quinnId);
    }

    [Fact]
    public async Task The_profile_save_does_not_drop_the_owners_own_row()
    {
        // Traces to: L2-218 #3, L2-129 #3
        var (owner, _) = await Register("Quinn", 38);

        var response = await owner.PutAsJsonAsync("/api/family", new { Members = new[] { new { Name = "Mae", Age = 5 } } });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await Code(response)).Should().Be("member_has_access");
        Member(await GetFamily(owner), "Quinn").GetProperty("access").GetString().Should().Be("Account");
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

    private static async Task<Guid> Add(HttpClient owner, object member)
    {
        var response = await owner.PostAsJsonAsync("/api/family/members", member);
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.Created, body);
        return JsonDocument.Parse(body).RootElement.GetProperty("member").GetProperty("id").GetGuid();
    }

    private static async Task<string?> Code(HttpResponseMessage response)
    {
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        return json.TryGetProperty("code", out var code) ? code.GetString() : null;
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
