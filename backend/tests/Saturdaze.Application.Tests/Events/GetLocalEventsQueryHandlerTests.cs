using FluentAssertions;
using Saturdaze.Application.Events;
using Saturdaze.Application.Tests.Support;
using Saturdaze.Domain.Entities;
using Xunit;

namespace Saturdaze.Application.Tests.Events;

public class GetLocalEventsQueryHandlerTests
{
    [Fact]
    public async Task Includes_only_events_overlapping_the_weekend()
    {
        await using var app = await SeedAsync();
        var handler = new GetLocalEventsQueryHandler(app.Db);

        var weekendOf = new DateOnly(2026, 6, 13); // Sat. Sunday is 6/14.
        var events = await handler.Handle(new GetLocalEventsQuery(weekendOf), default);

        events.Select(e => e.Name).Should().BeEquivalentTo(new[]
        {
            "Waterfront Festival (this weekend)",
            "Lavender Bloom (multi-week range covering weekend)"
        });
    }

    [Fact]
    public async Task Filters_by_max_drive_minutes()
    {
        await using var app = await SeedAsync();
        var handler = new GetLocalEventsQueryHandler(app.Db);
        var weekendOf = new DateOnly(2026, 6, 13);

        var nearby = await handler.Handle(new GetLocalEventsQuery(weekendOf, MaxDriveMinutes: 10), default);
        nearby.Should().OnlyContain(e => e.DriveMinutes <= 10);
        nearby.Select(e => e.Name).Should().NotContain("Lavender Bloom (multi-week range covering weekend)");
    }

    private static async Task<TestApp> SeedAsync()
    {
        var app = TestApp.Create();
        app.Db.LocalEvents.AddRange(
            new LocalEvent { Id = Guid.NewGuid(), Name = "Waterfront Festival (this weekend)",
                             StartsOn = new DateOnly(2026, 6, 13), EndsOn = new DateOnly(2026, 6, 14),
                             Location = "Port Credit", DriveMinutes = 5, Category = "Festival" },
            new LocalEvent { Id = Guid.NewGuid(), Name = "Lavender Bloom (multi-week range covering weekend)",
                             StartsOn = new DateOnly(2026, 5, 30), EndsOn = new DateOnly(2026, 7, 19),
                             Location = "Milton", DriveMinutes = 60, Category = "Seasonal" },
            new LocalEvent { Id = Guid.NewGuid(), Name = "Earlier event (week prior)",
                             StartsOn = new DateOnly(2026, 6, 6), EndsOn = new DateOnly(2026, 6, 7),
                             Location = "Toronto", DriveMinutes = 35, Category = "Music" },
            new LocalEvent { Id = Guid.NewGuid(), Name = "Later event (week after)",
                             StartsOn = new DateOnly(2026, 6, 20), EndsOn = new DateOnly(2026, 6, 21),
                             Location = "Hamilton", DriveMinutes = 45, Category = "Sport" });
        await app.Db.SaveChangesAsync();
        return app;
    }
}
