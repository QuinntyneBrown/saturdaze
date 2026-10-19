// Acceptance Test
// Traces to: L2-148 AC4
// Description: A locked-in meal never lands on top of a locked block or commitment.

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Restaurants;
using Saturdaze.Application.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Restaurants;

public class LockRestaurantCommandHandlerTests
{
    [Fact]
    public async Task A_new_dinner_block_starts_after_a_commitment_that_covers_the_dinner_window()
    {
        await using var app = TestApp.Create();
        var familyId = Guid.NewGuid();
        app.FamilyAccessor.FamilyId = familyId;
        var weekend = new Weekend { Id = Guid.NewGuid(), FamilyId = familyId, WeekendOf = new DateOnly(2026, 5, 16) };
        app.Db.Weekends.Add(weekend);
        app.Db.ItineraryBlocks.Add(new ItineraryBlock
        {
            Id = Guid.NewGuid(), WeekendId = weekend.Id, Day = DayOfWeekend.Saturday,
            StartTime = new TimeOnly(17, 0), EndTime = new TimeOnly(18, 0),
            Kind = BlockKind.Commitment, Title = "Workout window", IsLocked = true, Reason = "",
        });
        var restaurant = new Restaurant
        {
            Id = Guid.NewGuid(), Name = "Jack Astor's", Style = "Casual", Slot = MealSlot.Dinner,
            WifeApproved = true, DriveMinutes = 2, Notes = "",
        };
        app.Db.Restaurants.Add(restaurant);
        await app.Db.SaveChangesAsync();
        var clock = new StubDateTimeProvider { Today = new DateOnly(2026, 5, 16) };

        await new LockRestaurantCommandHandler(app.Db, app.FamilyAccessor, clock)
            .Handle(new LockRestaurantCommand(restaurant.Id, DayOfWeekend.Saturday, MealSlot.Dinner), default);

        var dinner = await app.Db.ItineraryBlocks.SingleAsync(b => b.Kind == BlockKind.Meal);
        dinner.IsLocked.Should().BeTrue();
        dinner.StartTime.Should().Be(new TimeOnly(18, 0));
        dinner.EndTime.Should().BeAfter(dinner.StartTime);
    }
}
