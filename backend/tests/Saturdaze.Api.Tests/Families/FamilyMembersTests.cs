using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
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
