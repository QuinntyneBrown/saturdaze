using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Infrastructure.SeedData;
using Saturdaze.Infrastructure.Tests.Support;
using Xunit;

namespace Saturdaze.Infrastructure.Tests.SeedData;

public class SeedDataLoaderTests : IAsyncLifetime
{
    private TestDatabase _db = null!;

    public async Task InitializeAsync() => _db = await TestDatabase.CreateAsync();
    public async Task DisposeAsync() => await _db.DisposeAsync();

    [Fact]
    public async Task First_run_seeds_curated_data_and_family()
    {
        await using var ctx = _db.CreateContext();
        await SeedDataLoader.SeedAsync(ctx);

        (await ctx.Activities.CountAsync()).Should().BeGreaterThan(0);
        (await ctx.Restaurants.CountAsync()).Should().BeGreaterThan(0);
        (await ctx.LocalEvents.CountAsync()).Should().BeGreaterThan(0);
        (await ctx.Families.CountAsync()).Should().Be(1);
        (await ctx.FamilyMembers.CountAsync()).Should().BeGreaterThan(0);
        (await ctx.Commitments.CountAsync()).Should().BeGreaterThan(0);
        (await ctx.Preferences.CountAsync()).Should().BeGreaterThan(0);
    }

    [Fact]
    public async Task Second_run_is_idempotent_no_new_rows_or_duplicates()
    {
        int activities, restaurants, events, families, members, commitments, preferences;

        await using (var ctx = _db.CreateContext())
        {
            await SeedDataLoader.SeedAsync(ctx);
            activities = await ctx.Activities.CountAsync();
            restaurants = await ctx.Restaurants.CountAsync();
            events = await ctx.LocalEvents.CountAsync();
            families = await ctx.Families.CountAsync();
            members = await ctx.FamilyMembers.CountAsync();
            commitments = await ctx.Commitments.CountAsync();
            preferences = await ctx.Preferences.CountAsync();
        }

        await using (var ctx = _db.CreateContext())
        {
            await SeedDataLoader.SeedAsync(ctx);
            (await ctx.Activities.CountAsync()).Should().Be(activities);
            (await ctx.Restaurants.CountAsync()).Should().Be(restaurants);
            (await ctx.LocalEvents.CountAsync()).Should().Be(events);
            (await ctx.Families.CountAsync()).Should().Be(families);
            (await ctx.FamilyMembers.CountAsync()).Should().Be(members);
            (await ctx.Commitments.CountAsync()).Should().Be(commitments);
            (await ctx.Preferences.CountAsync()).Should().Be(preferences);
        }
    }

    [Fact]
    public async Task Second_run_updates_changed_fields_without_duplicating_rows()
    {
        await using (var ctx = _db.CreateContext())
        {
            await SeedDataLoader.SeedAsync(ctx);
            var anyAct = await ctx.Activities.FirstAsync();
            anyAct.Description = "MUTATED OUT OF BAND";
            await ctx.SaveChangesAsync();
        }

        await using (var ctx = _db.CreateContext())
        {
            await SeedDataLoader.SeedAsync(ctx);
            (await ctx.Activities.AnyAsync(a => a.Description == "MUTATED OUT OF BAND")).Should().BeFalse();
        }
    }
}
