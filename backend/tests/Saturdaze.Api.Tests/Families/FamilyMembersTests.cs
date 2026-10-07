using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Families;

/// <summary>Family ownership and member sign-in (L1-037, ADR-016).</summary>
public class FamilyMembersTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public FamilyMembersTests(SaturdazeApiFactory factory) => _factory = factory;

    [Fact]
    public async Task The_account_that_registers_owns_its_family()
    {
        // Traces to: L2-124 #1
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var family = await GetFamily(owner.Client);

        family.GetProperty("isOwner").GetBoolean().Should().BeTrue();
        family.GetProperty("ownerEmail").GetString().Should().Be(owner.Email);
    }

    [Fact]
    public async Task A_member_saved_with_the_profile_has_no_sign_in()
    {
        // Traces to: L2-124 #3
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var save = await owner.Client.PutAsJsonAsync("/api/family", Profile(new { Name = "Mae", Age = 5 }));
        save.StatusCode.Should().Be(HttpStatusCode.OK, await save.Content.ReadAsStringAsync());

        var mae = Member(await GetFamily(owner.Client), "Mae");

        mae.GetProperty("access").GetString().Should().Be("None");
        mae.GetProperty("email").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task The_owner_adds_a_member_who_will_not_sign_in()
    {
        // Traces to: L2-125 #1
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var response = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = "Mae", Age = 5 });
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.Created, body);
        var result = JsonDocument.Parse(body).RootElement;
        result.GetProperty("member").GetProperty("name").GetString().Should().Be("Mae");
        result.GetProperty("member").GetProperty("access").GetString().Should().Be("None");
        result.GetProperty("member").GetProperty("email").ValueKind.Should().Be(JsonValueKind.Null);
        result.GetProperty("invite").ValueKind.Should().Be(JsonValueKind.Null);
        Member(await GetFamily(owner.Client), "Mae").GetProperty("age").GetInt32().Should().Be(5);
    }

    [Fact]
    public async Task Only_the_owner_adds_members()
    {
        // Traces to: L2-125 #2
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var other = await SignedInClient.JoinAsync(_factory, owner.FamilyId!.Value);

        var response = await other.Client.PostAsJsonAsync("/api/family/members", new { Name = "Mae", Age = 5 });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await Code(response)).Should().Be("owner_only");
        (await GetFamily(owner.Client)).GetProperty("members").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task A_member_name_is_used_once_per_family()
    {
        // Traces to: L2-125 #3
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        (await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = "Mae", Age = 5 }))
            .StatusCode.Should().Be(HttpStatusCode.Created);

        var response = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = "mae", Age = 6 });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await Code(response)).Should().Be("member_name_in_use");
    }

    [Theory]
    [InlineData("", 5)]
    [InlineData("Mae", -1)]
    [InlineData("Mae", 121)]
    public async Task An_invalid_member_is_rejected(string name, int age)
    {
        // Traces to: L2-125 #4
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var response = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = name, Age = age });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task A_member_name_over_100_characters_is_rejected()
    {
        // Traces to: L2-125 #4
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var response = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = new string('a', 101), Age = 5 });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task The_owner_invites_a_member_to_sign_in()
    {
        // Traces to: L2-126 #1, L2-124 #3
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var email = NewEmail("sara");

        var response = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = "Sara", Age = 36, Email = email });
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.Created, body);
        var result = JsonDocument.Parse(body).RootElement;
        result.GetProperty("member").GetProperty("access").GetString().Should().Be("Invited");
        result.GetProperty("member").GetProperty("email").GetString().Should().Be(email);
        var invite = result.GetProperty("invite");
        invite.GetProperty("email").GetString().Should().Be(email);
        var token = invite.GetProperty("token").GetString();
        token.Should().NotBeNullOrWhiteSpace();
        invite.GetProperty("url").GetString().Should().EndWith($"/accept-invite?token={Uri.EscapeDataString(token!)}");
        invite.GetProperty("expiresAtUtc").GetDateTimeOffset().Should().Be(_factory.Clock.UtcNow.AddDays(7));

        var sara = Member(await GetFamily(owner.Client), "Sara");
        sara.GetProperty("access").GetString().Should().Be("Invited");
        sara.GetProperty("email").GetString().Should().Be(email);
    }

    [Fact]
    public async Task An_invitation_token_is_stored_only_as_a_hash()
    {
        // Traces to: L2-126 #2
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var token = await Invite(owner, "Sara", NewEmail("sara"));

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var stored = await db.FamilyInvitations.SingleAsync(i => i.FamilyId == owner.FamilyId);
        stored.TokenHash.Should().NotBeNullOrWhiteSpace().And.NotBe(token);
    }

    [Fact]
    public async Task An_email_that_already_signs_in_cannot_be_invited()
    {
        // Traces to: L2-126 #3
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var existing = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var response = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = "Sara", Age = 36, Email = existing.Email.ToUpperInvariant() });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await Code(response)).Should().Be("email_in_use");
        (await GetFamily(owner.Client)).GetProperty("members").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task An_email_with_an_outstanding_invitation_is_not_invited_twice()
    {
        // Traces to: L2-126 #4
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var email = NewEmail("sara");
        await Invite(owner, "Sara", email);

        var response = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = "Sara Two", Age = 36, Email = email });

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await Code(response)).Should().Be("already_invited");
    }

    [Fact]
    public async Task A_malformed_email_is_rejected()
    {
        // Traces to: L2-126 #5
        var owner = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);

        var response = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = "Sara", Age = 36, Email = "not-an-email" });
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        body.Should().Contain("Email");
    }

    private static string NewEmail(string prefix) => $"{prefix}-{Guid.NewGuid():N}@example.com";

    private static async Task<string> Invite(SignedInClient.Session owner, string name, string email)
    {
        var response = await owner.Client.PostAsJsonAsync("/api/family/members", new { Name = name, Age = 36, Email = email });
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.Created, body);
        return JsonDocument.Parse(body).RootElement.GetProperty("invite").GetProperty("token").GetString()!;
    }

    private static async Task<string?> Code(HttpResponseMessage response)
    {
        var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync()).RootElement;
        return json.TryGetProperty("code", out var code) ? code.GetString() : null;
    }

    private static object Profile(params object[] members) => new
    {
        HomeLocation = "Port Credit, Mississauga, ON",
        BudgetEnabled = false,
        Members = members,
        Commitments = Array.Empty<object>(),
        Preferences = Array.Empty<object>(),
    };

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
