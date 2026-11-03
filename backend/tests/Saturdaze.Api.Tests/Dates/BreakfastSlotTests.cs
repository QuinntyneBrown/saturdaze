// Acceptance Test
// Traces to: L2-220 AC1, AC2, AC4
// Description: Breakfast is a meal slot: seeded, listed, idempotently re-seeded and lockable without taking lunch.

using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Dates;

public class BreakfastSlotTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;

    public BreakfastSlotTests(SaturdazeApiFactory factory)
    {
        _factory = factory;
        _factory.Clock.Today = new DateOnly(2026, 5, 14);
    }

    private static async Task<List<JsonElement>> Breakfasts(HttpClient client) =>
        (await Plans.ReadAsync(await client.GetAsync("/api/restaurants?day=2026-05-16&slot=Breakfast&take=50")))
            .EnumerateArray().ToList();

    [Fact]
    public async Task Breakfast_restaurants_are_seeded_and_listed()
    {
        // Traces to: L2-220 AC1
        var session = await SignedInClient.CreateAsync(_factory);

        var picks = await Breakfasts(session.Client);

        picks.Count.Should().BeGreaterThanOrEqualTo(2);
        picks.Should().OnlyContain(p => p.GetProperty("slot").GetString() == "Breakfast");
    }

    [Fact]
    public async Task Seeding_again_adds_no_breakfast_restaurants()
    {
        // Traces to: L2-220 AC2
        int Count()
        {
            using var scope = _factory.Services.CreateScope();
            return scope.ServiceProvider.GetRequiredService<AppDbContext>().Restaurants.Count(r => r.Slot == MealSlot.Breakfast);
        }
        var before = Count();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await TestSeed.SeedAsync(db);
            await db.SaveChangesAsync();
        }

        before.Should().BeGreaterThan(0);
        Count().Should().Be(before);
    }

    [Fact]
    public async Task Locking_a_breakfast_restaurant_holds_breakfast_and_keeps_lunch()
    {
        // Traces to: L2-220 AC4
        var session = await SignedInClient.CreateAsync(_factory, FamilyMode.Own);
        await FamilyProfiles.SaveAsync(session.Client, new
        {
            Members = new[] { new { Name = "Ada", Age = 41 }, new { Name = "Ben", Age = 39 } },
        });
        var weekend = await Plans.PlanAsync(session.Client, "2026-05-16");
        var lunchBefore = Plans.OfKind(weekend, "Meal", "Saturday")
            .Where(b => Plans.Title(b).StartsWith("Lunch")).Select(Plans.Shape).ToList();
        var breakfast = (await Breakfasts(session.Client)).First();

        var locked = await session.Client.PostAsJsonAsync($"/api/restaurants/{breakfast.GetProperty("id").GetGuid()}/lock",
            new { Day = "Saturday", Slot = "Breakfast" });
        await Plans.ReadAsync(locked);

        var after = await Plans.ReadAsync(await session.Client.GetAsync($"/api/weekends/{Plans.Id(weekend)}"));
        var meal = Plans.OfKind(after, "Meal", "Saturday")
            .Single(b => Plans.Title(b) == $"Breakfast: {breakfast.GetProperty("name").GetString()}");
        meal.GetProperty("isLocked").GetBoolean().Should().BeTrue();
        Plans.Start(meal).Should().BeOnOrAfter(new TimeOnly(8, 30)).And.BeBefore(new TimeOnly(11, 0));
        Plans.OfKind(after, "Meal", "Saturday").Where(b => Plans.Title(b).StartsWith("Lunch")).Select(Plans.Shape)
            .Should().BeEquivalentTo(lunchBefore);
    }
}
