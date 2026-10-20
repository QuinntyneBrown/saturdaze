// Traces to: L2-160, L2-161
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Admin;

/// <summary>
/// An administrator changes a family's weekend with the family's own rules (L2-160) and
/// every change is recorded as a <c>WeekendAuditEntry</c> the family's page lists (L2-161).
/// </summary>
public class AdminFamilyChangesTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private SignedInClient.Session _admin = null!;

    public AdminFamilyChangesTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Weather.Producer = (_, _, from, to) =>
        {
            var days = new List<WeatherForecast>();
            for (var d = from; d <= to; d = d.AddDays(1))
                days.Add(new WeatherForecast(d, new[] { "sunny", "warm" }, 24, 16, 0.0, false));
            return days;
        };
    }

    public async Task InitializeAsync() => _admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
    public Task DisposeAsync() => Task.CompletedTask;

    private static async Task<JsonElement> Ok(HttpResponseMessage res)
    {
        var text = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, text);
        return JsonDocument.Parse(text).RootElement;
    }

    private static async Task<string> Code(HttpResponseMessage res, HttpStatusCode status)
    {
        var text = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(status, text);
        return JsonDocument.Parse(text).RootElement.GetProperty("code").GetString()!;
    }

    /// <summary>A fresh household with one Saturday commitment, its upcoming weekend planned by the administrator.</summary>
    private async Task<(SignedInClient.Session Family, Guid FamilyId, JsonElement Weekend)> PlannedFamily()
    {
        var own = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Commitments.Add(new Commitment
            {
                Id = Guid.NewGuid(),
                FamilyId = own.FamilyId!.Value,
                Title = "Swim lessons",
                DayOfWeek = DayOfWeek.Saturday,
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(10, 0),
            });
            await db.SaveChangesAsync();
        }
        var weekend = await Ok(await _admin.Client.PostAsync($"/api/admin/families/{own.FamilyId}/weekends/plan", null));
        return (own, own.FamilyId!.Value, weekend);
    }

    private static JsonElement FirstActivity(JsonElement weekend, string day = "Saturday") =>
        weekend.GetProperty("blocks").EnumerateArray()
            .First(b => b.GetProperty("kind").GetString() == "Activity" && b.GetProperty("day").GetString() == day
                && !b.GetProperty("isLocked").GetBoolean());

    [Fact]
    public async Task Locking_a_block_is_visible_to_the_family_and_recorded_lock_then_unlock()
    {
        // Traces to: L2-160 AC2, L2-161 AC2, AC3
        var (family, familyId, weekend) = await PlannedFamily();
        var block = FirstActivity(weekend);
        var blockId = block.GetProperty("id").GetGuid();

        var locked = await Ok(await _admin.Client.PutAsJsonAsync($"/api/admin/families/{familyId}/blocks/{blockId}/lock", new { Locked = true }));
        locked.GetProperty("blocks").EnumerateArray().Single(b => b.GetProperty("id").GetGuid() == blockId)
            .GetProperty("isLocked").GetBoolean().Should().BeTrue();

        var theirs = await Ok(await family.Client.GetAsync("/api/weekends/current"));
        theirs.GetProperty("blocks").EnumerateArray().Single(b => b.GetProperty("id").GetGuid() == blockId)
            .GetProperty("isLocked").GetBoolean().Should().BeTrue();

        await Ok(await _admin.Client.PutAsJsonAsync($"/api/admin/families/{familyId}/blocks/{blockId}/lock", new { Locked = false }));

        // The family's own lock is not an administrator change (L2-161 AC3).
        await Ok(await family.Client.PutAsJsonAsync($"/api/blocks/{blockId}/lock", new { Locked = true }));

        var changes = await Ok(await _admin.Client.GetAsync($"/api/admin/families/{familyId}/weekend-changes"));
        var items = changes.GetProperty("items").EnumerateArray().ToList();
        items.Select(c => c.GetProperty("action").GetString()).Should().Equal("unlockBlock", "lockBlock", "plan");
        items[0].GetProperty("blockId").GetGuid().Should().Be(blockId);
        items[0].GetProperty("adminEmail").GetString().Should().Be(_admin.Email);
        items[0].GetProperty("summary").GetString().Should().Contain(block.GetProperty("title").GetString());
        items[1].GetProperty("day").GetString().Should().Be("Saturday");
        changes.GetProperty("total").GetInt32().Should().Be(3);
    }

    [Fact]
    public async Task Swapping_records_the_titles_before_and_after()
    {
        // Traces to: L2-160, L2-161 AC1
        var (_, familyId, weekend) = await PlannedFamily();
        var block = FirstActivity(weekend);
        var blockId = block.GetProperty("id").GetGuid();
        var before = block.GetProperty("title").GetString();

        var swapped = await Ok(await _admin.Client.PostAsJsonAsync($"/api/admin/families/{familyId}/blocks/{blockId}/swap", new { }));
        var after = swapped.GetProperty("blocks").EnumerateArray().Single(b => b.GetProperty("id").GetGuid() == blockId)
            .GetProperty("title").GetString();

        var changes = await Ok(await _admin.Client.GetAsync($"/api/admin/families/{familyId}/weekend-changes"));
        var first = changes.GetProperty("items").EnumerateArray().First();
        first.GetProperty("action").GetString().Should().Be("swap");
        first.GetProperty("adminEmail").GetString().Should().Be(_admin.Email);
        first.GetProperty("weekendId").GetGuid().Should().Be(weekend.GetProperty("id").GetGuid());
        JsonDocument.Parse(first.GetProperty("before").GetString()!).RootElement.GetProperty("title").GetString().Should().Be(before);
        JsonDocument.Parse(first.GetProperty("after").GetString()!).RootElement.GetProperty("title").GetString().Should().Be(after);
    }

    [Fact]
    public async Task Regenerating_keeps_locked_blocks_and_bumps_the_count()
    {
        // Traces to: L2-160 AC1, AC6
        var (_, familyId, weekend) = await PlannedFamily();
        var weekendId = weekend.GetProperty("id").GetGuid();
        var block = FirstActivity(weekend);
        var blockId = block.GetProperty("id").GetGuid();
        await Ok(await _admin.Client.PutAsJsonAsync($"/api/admin/families/{familyId}/blocks/{blockId}/lock", new { Locked = true }));

        var regenerated = await Ok(await _admin.Client.PostAsync($"/api/admin/families/{familyId}/weekends/{weekendId}/regenerate", null));
        regenerated.GetProperty("regenerateCount").GetInt32().Should().Be(1);
        var kept = regenerated.GetProperty("blocks").EnumerateArray().Single(b => b.GetProperty("id").GetGuid() == blockId);
        kept.GetProperty("title").GetString().Should().Be(block.GetProperty("title").GetString());
        kept.GetProperty("isLocked").GetBoolean().Should().BeTrue();

        var sundayBefore = regenerated.GetProperty("blocks").EnumerateArray()
            .Where(b => b.GetProperty("day").GetString() == "Sunday").Select(b => b.GetProperty("id").GetGuid()).ToList();
        var day = await Ok(await _admin.Client.PostAsync($"/api/admin/families/{familyId}/weekends/{weekendId}/days/saturday/regenerate", null));
        day.GetProperty("blocks").EnumerateArray()
            .Where(b => b.GetProperty("day").GetString() == "Sunday").Select(b => b.GetProperty("id").GetGuid())
            .Should().Equal(sundayBefore);

        var lockedDay = await Ok(await _admin.Client.PutAsJsonAsync($"/api/admin/families/{familyId}/weekends/{weekendId}/days/sunday/lock", new { Locked = true }));
        lockedDay.GetProperty("blocks").EnumerateArray().Where(b => b.GetProperty("day").GetString() == "Sunday")
            .All(b => b.GetProperty("isLocked").GetBoolean()).Should().BeTrue();

        var changes = await Ok(await _admin.Client.GetAsync($"/api/admin/families/{familyId}/weekend-changes"));
        changes.GetProperty("items").EnumerateArray().Select(c => c.GetProperty("action").GetString())
            .Should().Equal("lockDay", "regenerateDay", "regenerate", "lockBlock", "plan");
    }

    [Fact]
    public async Task The_familys_rules_still_apply_to_an_administrator()
    {
        // Traces to: L2-160 AC3, AC4
        var (_, familyId, weekend) = await PlannedFamily();
        var commitment = weekend.GetProperty("blocks").EnumerateArray().First(b => b.GetProperty("kind").GetString() == "Commitment");
        var unlock = await _admin.Client.PutAsJsonAsync(
            $"/api/admin/families/{familyId}/blocks/{commitment.GetProperty("id").GetGuid()}/lock", new { Locked = false });
        (await Code(unlock, HttpStatusCode.Conflict)).Should().Be("commitment_locked");

        var block = FirstActivity(weekend);
        var blockId = block.GetProperty("id").GetGuid();
        await Ok(await _admin.Client.PutAsJsonAsync($"/api/admin/families/{familyId}/blocks/{blockId}/lock", new { Locked = true }));
        var swap = await _admin.Client.PostAsJsonAsync($"/api/admin/families/{familyId}/blocks/{blockId}/swap", new { });
        (await Code(swap, HttpStatusCode.Conflict)).Should().Be("block_locked");

        // A refused change is not recorded.
        var changes = await Ok(await _admin.Client.GetAsync($"/api/admin/families/{familyId}/weekend-changes"));
        changes.GetProperty("items").EnumerateArray().Select(c => c.GetProperty("action").GetString())
            .Should().Equal("lockBlock", "plan");
    }

    [Fact]
    public async Task Non_admins_cannot_change_or_read_the_log()
    {
        // Traces to: L2-161 AC5, L2-158 AC4
        var user = await SignedInClient.CreateAsync(_factory);
        var familyId = user.FamilyId!.Value;
        (await user.Client.GetAsync($"/api/admin/families/{familyId}/weekend-changes")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await user.Client.PostAsync($"/api/admin/families/{familyId}/weekends/{Guid.NewGuid()}/regenerate", null)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await user.Client.PostAsJsonAsync($"/api/admin/families/{familyId}/blocks/{Guid.NewGuid()}/swap", new { })).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
