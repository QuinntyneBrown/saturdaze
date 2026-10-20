// Traces to: L2-157
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Api.Tests.Admin;

/// <summary>
/// <c>GET /api/admin/families</c>: every family with who signs in for it and whether the
/// upcoming weekend is planned (L2-157), behind the Admin policy (L2-111).
/// </summary>
public class AdminFamiliesTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private SignedInClient.Session _admin = null!;

    public AdminFamiliesTests(SaturdazeApiFactory factory) => _factory = factory;

    public async Task InitializeAsync() => _admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
    public Task DisposeAsync() => Task.CompletedTask;

    private static async Task<JsonElement> Body(HttpResponseMessage res)
    {
        var text = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, text);
        return JsonDocument.Parse(text).RootElement;
    }

    private static JsonElement? Family(JsonElement page, string name)
    {
        foreach (var item in page.GetProperty("items").EnumerateArray())
            if (item.GetProperty("name").GetString() == name) return item;
        return null;
    }

    [Fact]
    public async Task Lists_the_seeded_family_with_its_members_accounts_and_owner()
    {
        // Traces to: L2-157 AC1
        var page = await Body(await _admin.Client.GetAsync("/api/admin/families"));
        page.GetProperty("page").GetInt32().Should().Be(1);
        page.GetProperty("pageSize").GetInt32().Should().Be(50);
        page.GetProperty("total").GetInt32().Should().BeGreaterThan(0);

        var browns = Family(page, "The Browns");
        browns.Should().NotBeNull();
        var family = browns!.Value;
        family.GetProperty("homeLocation").GetString().Should().Be(SignedInClient.SeededFamilyHomeLocation);
        family.GetProperty("memberCount").GetInt32().Should().Be(4);
        var accounts = family.GetProperty("accounts").EnumerateArray().Select(a => a.GetString()).ToList();
        accounts.Should().Contain(_admin.Email);
        family.GetProperty("ownerEmail").ValueKind.Should().BeOneOf(JsonValueKind.String, JsonValueKind.Null);
        if (family.GetProperty("ownerEmail").ValueKind == JsonValueKind.String)
            accounts[0].Should().Be(family.GetProperty("ownerEmail").GetString());
    }

    [Fact]
    public async Task Search_matches_name_home_location_or_account_email()
    {
        // Traces to: L2-157 AC2
        var own = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var needle = own.Email.Split('@')[0];

        var page = await Body(await _admin.Client.GetAsync($"/api/admin/families?q={needle}"));
        page.GetProperty("total").GetInt32().Should().Be(1);
        var only = page.GetProperty("items").EnumerateArray().Single();
        only.GetProperty("id").GetGuid().Should().Be(own.FamilyId!.Value);
        only.GetProperty("name").GetString().Should().Be("Unnamed family");
        only.GetProperty("accounts").EnumerateArray().Select(a => a.GetString()).Should().Equal(own.Email);
        only.GetProperty("ownerEmail").GetString().Should().Be(own.Email);

        var byName = await Body(await _admin.Client.GetAsync("/api/admin/families?q=browns"));
        byName.GetProperty("items").EnumerateArray().Select(i => i.GetProperty("name").GetString())
            .Should().Contain("The Browns");
        foreach (var item in byName.GetProperty("items").EnumerateArray())
        {
            var hay = item.GetProperty("name").GetString() + " " + item.GetProperty("homeLocation").GetString() + " "
                + string.Join(" ", item.GetProperty("accounts").EnumerateArray().Select(a => a.GetString()));
            hay.Should().ContainEquivalentOf("browns");
        }
    }

    [Fact]
    public async Task Upcoming_is_null_until_the_weekend_is_planned()
    {
        // Traces to: L2-157 AC3
        var own = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var needle = own.Email.Split('@')[0];

        var before = await Body(await _admin.Client.GetAsync($"/api/admin/families?q={needle}"));
        before.GetProperty("items").EnumerateArray().Single().GetProperty("upcoming").ValueKind.Should().Be(JsonValueKind.Null);

        // The fixture clock says Saturday 16 May 2026, so the upcoming weekend is that Saturday.
        var planned = await own.Client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = "2026-05-16" });
        var weekend = await Body(planned);

        var after = await Body(await _admin.Client.GetAsync($"/api/admin/families?q={needle}"));
        var upcoming = after.GetProperty("items").EnumerateArray().Single().GetProperty("upcoming");
        upcoming.GetProperty("id").GetGuid().Should().Be(weekend.GetProperty("id").GetGuid());
        upcoming.GetProperty("weekendOf").GetString().Should().Be("2026-05-16");
        upcoming.GetProperty("blockCount").GetInt32().Should().Be(weekend.GetProperty("blocks").GetArrayLength());
        upcoming.GetProperty("lockedCount").GetInt32().Should().BeGreaterThanOrEqualTo(0);
        upcoming.GetProperty("regenerateCount").GetInt32().Should().Be(0);
    }

    [Fact]
    public async Task Non_admins_are_403_and_anonymous_callers_401()
    {
        // Traces to: L2-157 AC4, L2-111 AC2, AC3
        var user = await SignedInClient.CreateAsync(_factory);
        (await user.Client.GetAsync("/api/admin/families")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await _factory.CreateClient().GetAsync("/api/admin/families")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
