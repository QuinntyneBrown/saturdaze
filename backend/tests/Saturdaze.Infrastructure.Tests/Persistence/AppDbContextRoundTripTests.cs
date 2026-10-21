using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Tests.Support;
using Xunit;

namespace Saturdaze.Infrastructure.Tests.Persistence;

public class AppDbContextRoundTripTests : IAsyncLifetime
{
    private TestDatabase _db = null!;

    public async Task InitializeAsync() => _db = await TestDatabase.CreateAsync();
    public async Task DisposeAsync() => await _db.DisposeAsync();

    [Fact]
    public async Task Family_with_aggregates_round_trips()
    {
        var family = new Family
        {
            Id = Guid.NewGuid(),
            HomeLocation = "Port Credit, Mississauga, ON",
            BudgetEnabled = true,
            Members =
            {
                new FamilyMember { Id = Guid.NewGuid(), Name = "Quinn",     Age = 41 },
                new FamilyMember { Id = Guid.NewGuid(), Name = "Jennifer",  Age = 39 }
            },
            Commitments =
            {
                new Commitment
                {
                    Id = Guid.NewGuid(),
                    Title = "Swim",
                    DayOfWeek = DayOfWeek.Saturday,
                    StartTime = new TimeOnly(9, 30),
                    EndTime = new TimeOnly(10, 30)
                }
            },
            Preferences =
            {
                new Preference { Id = Guid.NewGuid(), Kind = PreferenceKind.Like, Value = "outdoors" }
            }
        };

        await using (var ctx = _db.CreateContext())
        {
            ctx.Families.Add(family);
            await ctx.SaveChangesAsync();
        }

        await using var read = _db.CreateContext();
        var loaded = await read.Families
            .Include(f => f.Members)
            .Include(f => f.Commitments)
            .Include(f => f.Preferences)
            .SingleAsync(f => f.Id == family.Id);

        loaded.HomeLocation.Should().Be("Port Credit, Mississauga, ON");
        loaded.BudgetEnabled.Should().BeTrue();
        loaded.Members.Should().HaveCount(2);
        loaded.Members.Should().Contain(m => m.Name == "Quinn" && m.Age == 41);
        loaded.Commitments.Should().ContainSingle(c =>
            c.Title == "Swim"
            && c.DayOfWeek == DayOfWeek.Saturday
            && c.StartTime == new TimeOnly(9, 30)
            && c.EndTime == new TimeOnly(10, 30));
        loaded.Preferences.Should().ContainSingle(p =>
            p.Kind == PreferenceKind.Like && p.Value == "outdoors");
    }

    [Fact]
    public async Task Activity_with_weather_tags_round_trips()
    {
        var act = new Activity
        {
            Id = Guid.NewGuid(),
            Name = "Test Park",
            Category = "Park",
            Indoor = false,
            MinAge = 3,
            MaxAge = 99,
            DriveMinutes = 12,
            WeatherTags = new() { "sunny", "warm", "mild" },
            Description = "A park.",
            MapUrl = "https://maps.google.com/?q=test",
            TypicalDurationMinutes = 90
        };

        await using (var ctx = _db.CreateContext())
        {
            ctx.Activities.Add(act);
            await ctx.SaveChangesAsync();
        }

        await using var read = _db.CreateContext();
        var loaded = await read.Activities.SingleAsync(a => a.Id == act.Id);
        loaded.Name.Should().Be("Test Park");
        loaded.WeatherTags.Should().BeEquivalentTo(new[] { "sunny", "warm", "mild" });
        loaded.Indoor.Should().BeFalse();
        loaded.MinAge.Should().Be(3);
        loaded.MaxAge.Should().Be(99);
        loaded.DriveMinutes.Should().Be(12);
        loaded.TypicalDurationMinutes.Should().Be(90);
        loaded.MapUrl.Should().Contain("maps.google.com");
    }

    [Fact]
    public async Task Activity_unique_name_enforced()
    {
        var name = $"Dup_{Guid.NewGuid():N}";
        await using (var ctx = _db.CreateContext())
        {
            ctx.Activities.Add(new Activity
            {
                Id = Guid.NewGuid(), Name = name, Category = "X",
                Description = "d", MapUrl = "u"
            });
            await ctx.SaveChangesAsync();
        }

        await using (var ctx = _db.CreateContext())
        {
            ctx.Activities.Add(new Activity
            {
                Id = Guid.NewGuid(), Name = name, Category = "X",
                Description = "d", MapUrl = "u"
            });
            var act = async () => await ctx.SaveChangesAsync();
            await act.Should().ThrowAsync<DbUpdateException>();
        }
    }

    [Fact]
    public async Task Restaurant_round_trips()
    {
        var r = new Restaurant
        {
            Id = Guid.NewGuid(),
            Name = "Snug Harbour",
            Style = "Seafood",
            Slot = MealSlot.Dinner,
            WifeApproved = true,
            DriveMinutes = 5,
            Notes = "Lakeside."
        };

        await using (var ctx = _db.CreateContext())
        {
            ctx.Restaurants.Add(r);
            await ctx.SaveChangesAsync();
        }

        await using var read = _db.CreateContext();
        var loaded = await read.Restaurants.SingleAsync(x => x.Id == r.Id);
        loaded.Slot.Should().Be(MealSlot.Dinner);
        loaded.WifeApproved.Should().BeTrue();
        loaded.Style.Should().Be("Seafood");
        loaded.DriveMinutes.Should().Be(5);
        loaded.Notes.Should().Be("Lakeside.");
    }

    [Fact]
    public async Task LocalEvent_round_trips()
    {
        var ev = new LocalEvent
        {
            Id = Guid.NewGuid(),
            Name = "Buskerfest",
            StartsOn = new DateOnly(2026, 8, 15),
            EndsOn = new DateOnly(2026, 8, 16),
            Location = "Port Credit",
            DriveMinutes = 3,
            Url = "https://example.com",
            Category = "Festival"
        };

        await using (var ctx = _db.CreateContext())
        {
            ctx.LocalEvents.Add(ev);
            await ctx.SaveChangesAsync();
        }

        await using var read = _db.CreateContext();
        var loaded = await read.LocalEvents.SingleAsync(e => e.Id == ev.Id);
        loaded.StartsOn.Should().Be(new DateOnly(2026, 8, 15));
        loaded.EndsOn.Should().Be(new DateOnly(2026, 8, 16));
        loaded.Location.Should().Be("Port Credit");
        loaded.Category.Should().Be("Festival");
    }

    [Fact]
    public async Task Weekend_with_blocks_and_errands_cascade_round_trips()
    {
        var familyId = await SeedSingleFamily();
        var wkId = Guid.NewGuid();
        var weekend = new Weekend
        {
            Id = wkId,
            FamilyId = familyId,
            WeekendOf = new DateOnly(2026, 5, 16),
            Notes = "test",
            Blocks =
            {
                new ItineraryBlock
                {
                    Id = Guid.NewGuid(),
                    Day = DayOfWeekend.Saturday,
                    StartTime = new TimeOnly(9, 30),
                    EndTime = new TimeOnly(10, 30),
                    Kind = BlockKind.Commitment,
                    Title = "Swim",
                    Reason = "fixed commitment",
                    SortOrder = 0,
                    IsLocked = true
                },
                new ItineraryBlock
                {
                    Id = Guid.NewGuid(),
                    Day = DayOfWeekend.Saturday,
                    StartTime = new TimeOnly(11, 0),
                    EndTime = new TimeOnly(12, 30),
                    Kind = BlockKind.Activity,
                    Title = "Park",
                    Reason = "sunny — outdoor pick",
                    SortOrder = 1
                }
            },
            Errands =
            {
                new ShoppingErrand
                {
                    Id = Guid.NewGuid(),
                    Description = "Costco run",
                    EstimatedMinutes = 60,
                    Done = false
                }
            }
        };

        await using (var ctx = _db.CreateContext())
        {
            ctx.Weekends.Add(weekend);
            await ctx.SaveChangesAsync();
        }

        await using (var ctx = _db.CreateContext())
        {
            var loaded = await ctx.Weekends
                .Include(w => w.Blocks)
                .Include(w => w.Errands)
                .SingleAsync(w => w.Id == wkId);
            loaded.WeekendOf.Should().Be(new DateOnly(2026, 5, 16));
            loaded.Blocks.Should().HaveCount(2);
            loaded.Blocks.Should().ContainSingle(b => b.Kind == BlockKind.Commitment && b.IsLocked);
            loaded.Errands.Should().ContainSingle(e => e.Description == "Costco run" && e.EstimatedMinutes == 60);
        }

        // Cascade delete: removing the weekend should remove blocks and errands.
        await using (var ctx = _db.CreateContext())
        {
            var w = await ctx.Weekends.SingleAsync(x => x.Id == wkId);
            ctx.Weekends.Remove(w);
            await ctx.SaveChangesAsync();

            (await ctx.ItineraryBlocks.AnyAsync(b => b.WeekendId == wkId)).Should().BeFalse();
            (await ctx.ShoppingErrands.AnyAsync(e => e.WeekendId == wkId)).Should().BeFalse();
        }
    }

    [Fact]
    public async Task Weekend_unique_per_family_and_date()
    {
        var familyId = await SeedSingleFamily();
        var date = new DateOnly(2026, 6, 6);

        await using (var ctx = _db.CreateContext())
        {
            ctx.Weekends.Add(new Weekend { Id = Guid.NewGuid(), FamilyId = familyId, WeekendOf = date });
            await ctx.SaveChangesAsync();
        }

        await using (var ctx = _db.CreateContext())
        {
            ctx.Weekends.Add(new Weekend { Id = Guid.NewGuid(), FamilyId = familyId, WeekendOf = date });
            var act = async () => await ctx.SaveChangesAsync();
            await act.Should().ThrowAsync<DbUpdateException>();
        }
    }

    [Fact]
    public async Task Cascade_delete_of_family_removes_members_commitments_preferences()
    {
        var familyId = Guid.NewGuid();
        await using (var ctx = _db.CreateContext())
        {
            ctx.Families.Add(new Family
            {
                Id = familyId,
                HomeLocation = "Cascade test",
                Members = { new FamilyMember { Id = Guid.NewGuid(), Name = "K", Age = 9 } },
                Commitments = { new Commitment { Id = Guid.NewGuid(), Title = "T", DayOfWeek = DayOfWeek.Saturday, StartTime = new TimeOnly(9,0), EndTime = new TimeOnly(10,0) } },
                Preferences = { new Preference { Id = Guid.NewGuid(), Kind = PreferenceKind.Like, Value = "v" } }
            });
            await ctx.SaveChangesAsync();
        }

        await using (var ctx = _db.CreateContext())
        {
            var f = await ctx.Families.SingleAsync(x => x.Id == familyId);
            ctx.Families.Remove(f);
            await ctx.SaveChangesAsync();
        }

        await using (var ctx = _db.CreateContext())
        {
            (await ctx.FamilyMembers.AnyAsync(m => m.FamilyId == familyId)).Should().BeFalse();
            (await ctx.Commitments.AnyAsync(c => c.FamilyId == familyId)).Should().BeFalse();
            (await ctx.Preferences.AnyAsync(p => p.FamilyId == familyId)).Should().BeFalse();
        }
    }

    private async Task<Guid> SeedSingleFamily()
    {
        var id = Guid.NewGuid();
        await using var ctx = _db.CreateContext();
        ctx.Families.Add(new Family { Id = id, HomeLocation = $"X-{id:N}" });
        await ctx.SaveChangesAsync();
        return id;
    }
}
