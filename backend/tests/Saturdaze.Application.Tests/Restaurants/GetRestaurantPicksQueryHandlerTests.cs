using FluentAssertions;
using Saturdaze.Application.Restaurants;
using Saturdaze.Application.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Restaurants;

public class GetRestaurantPicksQueryHandlerTests
{
    [Fact]
    public async Task Filters_by_slot_and_orders_by_drive_minutes_ascending()
    {
        await using var app = await SeedAsync();
        var handler = new GetRestaurantPicksQueryHandler(app.Db, app.FamilyAccessor);

        var picks = await handler.Handle(
            new GetRestaurantPicksQuery(new DateOnly(2026, 5, 16), MealSlot.Dinner), default);

        picks.Should().OnlyContain(r => r.Slot == MealSlot.Dinner);
        picks.Select(r => r.DriveMinutes).Should().BeInAscendingOrder();
    }

    [Fact]
    public async Task WifeApprovedOnly_excludes_unapproved()
    {
        await using var app = await SeedAsync();
        var handler = new GetRestaurantPicksQueryHandler(app.Db, app.FamilyAccessor);
        var picks = await handler.Handle(
            new GetRestaurantPicksQuery(new DateOnly(2026, 5, 16), MealSlot.Dinner, WifeApprovedOnly: true),
            default);
        picks.Should().OnlyContain(r => r.WifeApproved);
    }

    [Fact]
    public async Task NearActivityId_orders_by_drive_proximity_to_activity()
    {
        await using var app = await SeedAsync();
        // Activity at drive=12. Restaurants at 4, 10, 25.
        var faraway = app.Db.Activities.Single(a => a.Name == "Faraway").Id;
        var handler = new GetRestaurantPicksQueryHandler(app.Db, app.FamilyAccessor);

        // Faraway has drive=40 → restaurant closest in drive to 40 should be first.
        var picks = await handler.Handle(
            new GetRestaurantPicksQuery(
                new DateOnly(2026, 5, 16), MealSlot.Dinner, NearActivityId: faraway, WifeApprovedOnly: false),
            default);

        picks.First().DriveMinutes.Should().Be(25); // closest to 40 among 4/10/25
    }

    private static async Task<TestApp> SeedAsync()
    {
        var app = TestApp.Create();
        var familyId = Guid.NewGuid();
        app.FamilyAccessor.FamilyId = familyId;
        app.Db.Families.Add(new Family { Id = familyId, HomeLocation = "Port Credit" });

        app.Db.Activities.AddRange(
            new Activity { Id = Guid.NewGuid(), Name = "Nearby",  Category = "X", DriveMinutes = 12, MinAge = 0, MaxAge = 99, Description = "d", MapUrl = "u" },
            new Activity { Id = Guid.NewGuid(), Name = "Faraway", Category = "X", DriveMinutes = 40, MinAge = 0, MaxAge = 99, Description = "d", MapUrl = "u" });

        app.Db.Restaurants.AddRange(
            new Restaurant { Id = Guid.NewGuid(), Name = "Snug",  Style = "Seafood", Slot = MealSlot.Dinner, WifeApproved = true,  DriveMinutes = 4,  Notes = "" },
            new Restaurant { Id = Guid.NewGuid(), Name = "Brogue",Style = "Pub",     Slot = MealSlot.Dinner, WifeApproved = true,  DriveMinutes = 10, Notes = "" },
            new Restaurant { Id = Guid.NewGuid(), Name = "Wings", Style = "Wings",   Slot = MealSlot.Dinner, WifeApproved = false, DriveMinutes = 25, Notes = "" },
            new Restaurant { Id = Guid.NewGuid(), Name = "Cora",  Style = "Brunch",  Slot = MealSlot.Lunch,  WifeApproved = true,  DriveMinutes = 5,  Notes = "" });

        await app.Db.SaveChangesAsync();
        return app;
    }
}
