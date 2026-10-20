// Traces to: L2-158, L2-159
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Admin;

/// <summary>
/// An administrator reads, plans and lists one family's weekends inside that family's
/// scope (L2-158, L2-159): the family named in the route, never the administrator's own.
/// </summary>
public class AdminFamilyWeekendTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private const string Upcoming = "2026-05-16"; // the fixture clock's Saturday

    private readonly SaturdazeApiFactory _factory;
    private SignedInClient.Session _admin = null!;

    public AdminFamilyWeekendTests(SaturdazeApiFactory factory)
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

    private async Task<int> WeekendCount(Guid familyId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await db.Weekends.CountAsync(w => w.FamilyId == familyId);
    }

    [Fact]
    public async Task Family_detail_names_the_family_and_its_members()
    {
        // Traces to: L2-159
        var seededId = _admin.FamilyId!.Value;
        var detail = await Ok(await _admin.Client.GetAsync($"/api/admin/families/{seededId}"));
        detail.GetProperty("family").GetProperty("name").GetString().Should().Be("The Browns");
        detail.GetProperty("upcomingWeekendOf").GetString().Should().Be(Upcoming);
        detail.GetProperty("members").EnumerateArray().Select(m => m.GetProperty("name").GetString())
            .Should().HaveCount(4).And.Contain("Quinn");
        detail.GetProperty("commitments").GetArrayLength().Should().BeGreaterThan(0);

        (await _admin.Client.GetAsync($"/api/admin/families/{Guid.NewGuid()}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Reading_an_unplanned_weekend_is_404_and_creates_nothing_until_planned()
    {
        // Traces to: L2-159 AC1, AC2
        var family = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var familyId = family.FamilyId!.Value;

        var read = await _admin.Client.GetAsync($"/api/admin/families/{familyId}/weekends/current");
        read.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await read.Content.ReadAsStringAsync()).Should().Contain("weekend_not_planned");
        (await WeekendCount(familyId)).Should().Be(0);

        var planned = await Ok(await _admin.Client.PostAsync($"/api/admin/families/{familyId}/weekends/plan", null));
        planned.GetProperty("weekendOf").GetString().Should().Be(Upcoming);
        planned.GetProperty("blocks").GetArrayLength().Should().BeGreaterThan(0);
        var id = planned.GetProperty("id").GetGuid();

        var again = await Ok(await _admin.Client.PostAsync($"/api/admin/families/{familyId}/weekends/plan", null));
        again.GetProperty("id").GetGuid().Should().Be(id);
        (await WeekendCount(familyId)).Should().Be(1);

        var current = await Ok(await _admin.Client.GetAsync($"/api/admin/families/{familyId}/weekends/current"));
        current.GetProperty("id").GetGuid().Should().Be(id);
        current.GetProperty("days").GetArrayLength().Should().Be(2);

        // The family sees exactly what the administrator planned (L2-158 AC1).
        var theirs = await Ok(await family.Client.GetAsync("/api/weekends/current"));
        theirs.GetProperty("id").GetGuid().Should().Be(id);
    }

    [Fact]
    public async Task The_admins_own_family_is_untouched_and_other_families_ids_are_404()
    {
        // Traces to: L2-158 AC1, AC2, AC3
        var b = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var c = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var bId = b.FamilyId!.Value;
        var cId = c.FamilyId!.Value;

        var ownBefore = await WeekendCount(_admin.FamilyId!.Value);
        var bWeekend = await Ok(await _admin.Client.PostAsync($"/api/admin/families/{bId}/weekends/plan", null));
        (await WeekendCount(_admin.FamilyId!.Value)).Should().Be(ownBefore);
        (await WeekendCount(cId)).Should().Be(0);

        var bWeekendId = bWeekend.GetProperty("id").GetGuid();
        var cross = await _admin.Client.PostAsync($"/api/admin/families/{cId}/weekends/{bWeekendId}/regenerate", null);
        cross.StatusCode.Should().Be(HttpStatusCode.NotFound);
        var bAfter = await Ok(await _admin.Client.GetAsync($"/api/admin/families/{bId}/weekends/current"));
        bAfter.GetProperty("regenerateCount").GetInt32().Should().Be(0);

        (await _admin.Client.GetAsync($"/api/admin/families/{Guid.NewGuid()}/weekends/current")).StatusCode
            .Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task History_lists_only_past_weekends_newest_first()
    {
        // Traces to: L2-159 AC6
        var family = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        var familyId = family.FamilyId!.Value;
        foreach (var saturday in new[] { "2026-05-02", "2026-05-09", Upcoming })
            (await family.Client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = saturday })).EnsureSuccessStatusCode();

        var history = await Ok(await _admin.Client.GetAsync($"/api/admin/families/{familyId}/weekends/history"));
        history.EnumerateArray().Select(w => w.GetProperty("weekendOf").GetString())
            .Should().Equal("2026-05-09", "2026-05-02");
    }

    [Fact]
    public async Task Non_admins_are_403_on_every_family_route()
    {
        // Traces to: L2-158 AC4
        var user = await SignedInClient.CreateAsync(_factory);
        var familyId = user.FamilyId!.Value;
        (await user.Client.GetAsync($"/api/admin/families/{familyId}")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await user.Client.GetAsync($"/api/admin/families/{familyId}/weekends/current")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await user.Client.PostAsync($"/api/admin/families/{familyId}/weekends/plan", null)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await user.Client.GetAsync($"/api/admin/families/{familyId}/weekends/history")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
