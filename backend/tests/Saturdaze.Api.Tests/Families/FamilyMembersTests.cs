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
