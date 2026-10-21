// Traces to: L2-159, L2-160
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Api.Tests.Admin;

/// <summary>
/// An administrator describes a prospective family, generates its sample
/// weekend (L2-159) and shapes it the way a family would (L2-160).
/// </summary>
public class AdminProspectsTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    public AdminProspectsTests(SaturdazeApiFactory factory) => _factory = factory;

    /// <summary>The fixture clock sits on a Saturday, so "upcoming" is today.</summary>
    private DateOnly Saturday => _factory.Clock.Today;

    [Fact]
    public async Task Describing_a_family_plans_both_days_for_it()
    {
        // Traces to: L2-159 #1
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);

        var prospect = await Prospects.CreateAsync(admin.Client, Prospects.Riveras(Saturday));

        prospect.GetProperty("status").GetString().Should().Be("Draft");
        prospect.GetProperty("familyName").GetString().Should().Be("The Riveras");
        prospect.GetProperty("homeLocation").GetString().Should().Be("Lakeview, Mississauga, ON");
        prospect.GetProperty("likes").EnumerateArray().Select(l => l.GetString()).Should().Equal("parks");
        var members = prospect.GetProperty("members").EnumerateArray().ToList();
        members.Select(m => m.GetProperty("name").GetString()).Should().Equal("Dani", "Mateo");
        members.Select(m => m.GetProperty("age").GetInt32()).Should().Equal(38, 7);
        prospect.GetProperty("weekendOf").GetString().Should().Be(Saturday.ToString("yyyy-MM-dd"));

        var weekend = prospect.GetProperty("weekend");
        weekend.GetProperty("weekendOf").GetString().Should().Be(Saturday.ToString("yyyy-MM-dd"));
        var days = Prospects.Blocks(prospect).Select(b => b.GetProperty("day").GetString()).Distinct();
        days.Should().BeEquivalentTo(new[] { "Saturday", "Sunday" });
        Prospects.Blocks(prospect).Should().Contain(b => b.GetProperty("kind").GetString() == "Activity");
    }

    [Fact]
    public async Task The_weekend_defaults_to_the_upcoming_Saturday()
    {
        // Traces to: L2-159 #1
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var prospect = await Prospects.CreateAsync(admin.Client, Prospects.Riveras(null));
        prospect.GetProperty("weekendOf").GetString().Should().Be(Saturday.ToString("yyyy-MM-dd"));
    }

    [Theory]
    [InlineData("sunday", "weekendof")]
    [InlineData("no-name", "familyname")]
    [InlineData("no-members", "members")]
    [InlineData("nine-members", "members")]
    [InlineData("long-name", "members")]
    [InlineData("age", "members")]
    public async Task A_malformed_family_is_refused(string shape, string field)
    {
        // Traces to: L2-159 #2
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        object member(string name, int age) => new { Name = name, Age = age };
        object payload = shape switch
        {
            "sunday" => new { FamilyName = "X", Members = new[] { member("Dani", 38) }, WeekendOf = Saturday.AddDays(1) },
            "no-name" => new { FamilyName = "", Members = new[] { member("Dani", 38) } },
            "no-members" => new { FamilyName = "X", Members = Array.Empty<object>() },
            "nine-members" => new { FamilyName = "X", Members = Enumerable.Range(0, 9).Select(i => member($"M{i}", 10)).ToArray() },
            "long-name" => new { FamilyName = "X", Members = new[] { member(new string('a', 101), 38) } },
            _ => new { FamilyName = "X", Members = new[] { member("Dani", 130) } },
        };

        var response = await admin.Client.PostAsJsonAsync("/api/admin/prospects", payload);
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest, body);
        JsonDocument.Parse(body).RootElement.GetProperty("errors").EnumerateObject()
            .Select(p => p.Name.ToLowerInvariant()).Should().Contain(name => name.StartsWith(field));
    }

    [Fact]
    public async Task Only_administrators_reach_prospects()
    {
        // Traces to: L2-159 #3
        var user = await SignedInClient.CreateAsync(_factory);
        (await user.Client.PostAsJsonAsync("/api/admin/prospects", Prospects.Riveras())).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await user.Client.GetAsync("/api/admin/prospects")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await _factory.CreateClient().GetAsync("/api/admin/prospects")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task A_prospect_weekend_is_invisible_to_families()
    {
        // Traces to: L2-159 #4
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var prospect = await Prospects.CreateAsync(admin.Client, Prospects.Riveras(Saturday));
        var weekendId = prospect.GetProperty("weekend").GetProperty("id").GetGuid();

        var family = await SignedInClient.CreateAsync(_factory);
        (await family.Client.GetAsync($"/api/weekends/{weekendId}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        var current = await family.Client.GetAsync("/api/weekends/current");
        if (current.StatusCode == HttpStatusCode.OK)
        {
            JsonDocument.Parse(await current.Content.ReadAsStringAsync()).RootElement
                .GetProperty("id").GetGuid().Should().NotBe(weekendId);
        }
    }

    [Fact]
    public async Task Prospects_are_read_back_one_by_one_and_as_a_list()
    {
        // Traces to: L2-159 #5, L2-160 #6
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var first = await Prospects.CreateAsync(admin.Client, Prospects.Riveras(Saturday, "The Okafors"));
        // The fixture clock is frozen; a later minute makes "newest first" observable.
        _factory.Clock.TimeOfDay = TimeSpan.FromMinutes(1);
        JsonElement second;
        try { second = await Prospects.CreateAsync(admin.Client, Prospects.Riveras(Saturday, "The Nguyens")); }
        finally { _factory.Clock.TimeOfDay = TimeSpan.Zero; }
        var firstId = first.GetProperty("id").GetGuid();
        var secondId = second.GetProperty("id").GetGuid();

        var one = await Prospects.GetAsync(admin.Client, firstId);
        one.GetProperty("familyName").GetString().Should().Be("The Okafors");
        one.GetProperty("weekend").GetProperty("blocks").GetArrayLength().Should().BeGreaterThan(0);
        (await admin.Client.GetAsync($"/api/admin/prospects/{Guid.NewGuid()}")).StatusCode.Should().Be(HttpStatusCode.NotFound);

        await PlatformInvites.SendOneAsync(admin.Client, PlatformInvites.NewEmail("okafor"), firstId);

        var list = await admin.Client.GetAsync("/api/admin/prospects");
        var body = await list.Content.ReadAsStringAsync();
        list.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var rows = JsonDocument.Parse(body).RootElement.EnumerateArray()
            .Where(p => p.GetProperty("id").GetGuid() == firstId || p.GetProperty("id").GetGuid() == secondId)
            .ToList();
        rows.Select(p => p.GetProperty("id").GetGuid()).Should().Equal(secondId, firstId);
        rows[1].GetProperty("invitationCount").GetInt32().Should().Be(1);
        rows[1].GetProperty("status").GetString().Should().Be("Invited");
        rows[0].GetProperty("status").GetString().Should().Be("Draft");
        rows[0].TryGetProperty("weekend", out var weekend).Should().BeTrue();
        weekend.ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task Regenerating_keeps_locked_blocks()
    {
        // Traces to: L2-160 #1
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var prospect = await Prospects.CreateAsync(admin.Client, Prospects.Riveras(Saturday));
        var id = prospect.GetProperty("id").GetGuid();
        var activity = Prospects.FirstBlockOfKind(prospect, "Activity");
        var activityId = activity.GetProperty("id").GetGuid();
        await Prospects.LockAsync(admin.Client, id, activityId, true);

        var response = await Prospects.RegenerateAsync(admin.Client, id);
        var body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var weekend = JsonDocument.Parse(body).RootElement;
        weekend.GetProperty("regenerateCount").GetInt32().Should().Be(1);
        var kept = Prospects.Block(weekend, activityId);
        kept.GetProperty("title").GetString().Should().Be(activity.GetProperty("title").GetString());
        kept.GetProperty("isLocked").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task Swapping_follows_the_family_rules()
    {
        // Traces to: L2-160 #2
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var prospect = await Prospects.CreateAsync(admin.Client, Prospects.Riveras(Saturday));
        var id = prospect.GetProperty("id").GetGuid();
        var activity = Prospects.FirstBlockOfKind(prospect, "Activity");
        var activityId = activity.GetProperty("id").GetGuid();

        var swapped = await Prospects.SwapAsync(admin.Client, id, activityId);
        var body = await swapped.Content.ReadAsStringAsync();
        swapped.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var after = Prospects.Block(JsonDocument.Parse(body).RootElement, activityId);
        after.GetProperty("refId").GetGuid().Should().NotBe(activity.GetProperty("refId").GetGuid());

        await Prospects.LockAsync(admin.Client, id, activityId, true);
        var locked = await Prospects.SwapAsync(admin.Client, id, activityId);
        locked.StatusCode.Should().Be(HttpStatusCode.Conflict);
        PlatformInvites.CodeOf(await locked.Content.ReadAsStringAsync()).Should().Be("block_locked");

        var meal = Prospects.FirstBlockOfKind(prospect, "Meal");
        var notSwappable = await Prospects.SwapAsync(admin.Client, id, meal.GetProperty("id").GetGuid());
        notSwappable.StatusCode.Should().Be(HttpStatusCode.Conflict);
        PlatformInvites.CodeOf(await notSwappable.Content.ReadAsStringAsync()).Should().Be("block_not_swappable");
    }

    [Fact]
    public async Task Locking_and_unlocking_a_block()
    {
        // Traces to: L2-160 #3
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var prospect = await Prospects.CreateAsync(admin.Client, Prospects.Riveras(Saturday));
        var id = prospect.GetProperty("id").GetGuid();
        var blockId = Prospects.FirstBlockOfKind(prospect, "Activity").GetProperty("id").GetGuid();

        Prospects.Block(await Prospects.LockAsync(admin.Client, id, blockId, true), blockId)
            .GetProperty("isLocked").GetBoolean().Should().BeTrue();
        Prospects.Block(await Prospects.LockAsync(admin.Client, id, blockId, false), blockId)
            .GetProperty("isLocked").GetBoolean().Should().BeFalse();
    }

    [Fact]
    public async Task A_block_that_is_not_on_this_prospects_weekend_is_404()
    {
        // Traces to: L2-160 #4
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var one = await Prospects.CreateAsync(admin.Client, Prospects.Riveras(Saturday, "One"));
        var other = await Prospects.CreateAsync(admin.Client, Prospects.Riveras(Saturday, "Other"));
        var oneId = one.GetProperty("id").GetGuid();
        var othersBlock = Prospects.FirstBlockOfKind(other, "Activity").GetProperty("id").GetGuid();

        (await Prospects.SwapAsync(admin.Client, oneId, othersBlock)).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await admin.Client.PutAsJsonAsync($"/api/admin/prospects/{oneId}/blocks/{othersBlock}/lock", new { Locked = true }))
            .StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await Prospects.RegenerateAsync(admin.Client, Guid.NewGuid())).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await Prospects.SwapAsync(admin.Client, oneId, Guid.NewGuid())).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
