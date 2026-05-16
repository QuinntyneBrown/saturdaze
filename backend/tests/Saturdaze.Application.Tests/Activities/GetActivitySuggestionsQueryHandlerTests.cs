using FluentAssertions;
using Saturdaze.Application.Activities;
using Saturdaze.Application.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Activities;

public class GetActivitySuggestionsQueryHandlerTests
{
    [Fact]
    public async Task Filters_indoor_outdoor()
    {
        await using var app = await SeedAsync();
        var handler = new GetActivitySuggestionsQueryHandler(app.Db, app.FamilyAccessor);

        var indoor = await handler.Handle(new GetActivitySuggestionsQuery(Indoor: true), default);
        indoor.Should().OnlyContain(a => a.Indoor);
        indoor.Select(a => a.Name).Should().Contain("Rec Room");

        var outdoor = await handler.Handle(new GetActivitySuggestionsQuery(Indoor: false), default);
        outdoor.Should().OnlyContain(a => !a.Indoor);
    }

    [Fact]
    public async Task Filters_by_max_drive_minutes()
    {
        await using var app = await SeedAsync();
        var handler = new GetActivitySuggestionsQueryHandler(app.Db, app.FamilyAccessor);

        var results = await handler.Handle(new GetActivitySuggestionsQuery(MaxDriveMinutes: 15), default);
        results.Should().OnlyContain(a => a.DriveMinutes <= 15);
        results.Select(a => a.Name).Should().NotContain("Faraway Zoo");
    }

    [Fact]
    public async Task Filters_by_age_window()
    {
        await using var app = await SeedAsync();
        var handler = new GetActivitySuggestionsQueryHandler(app.Db, app.FamilyAccessor);

        // Need activities that allow ages [5..9].
        var results = await handler.Handle(new GetActivitySuggestionsQuery(MinAge: 5, MaxAge: 9), default);
        results.Should().OnlyContain(a => a.MinAge <= 5 && a.MaxAge >= 9);
        results.Select(a => a.Name).Should().NotContain("Teen-only Escape Room");
    }

    [Fact]
    public async Task Filters_by_weather_tag_case_insensitive()
    {
        await using var app = await SeedAsync();
        var handler = new GetActivitySuggestionsQueryHandler(app.Db, app.FamilyAccessor);

        var results = await handler.Handle(new GetActivitySuggestionsQuery(Weather: "RAIN"), default);
        results.Should().OnlyContain(a => a.WeatherTags.Any(t =>
            string.Equals(t, "rain", StringComparison.OrdinalIgnoreCase)));
    }

    [Fact]
    public async Task TryNew_excludes_activities_used_in_recent_weekends()
    {
        await using var app = await SeedAsync();

        var park = await Single(app, "Local Park");
        var recentWeekendId = Guid.NewGuid();
        app.Db.Weekends.Add(new Weekend
        {
            Id = recentWeekendId,
            FamilyId = app.FamilyAccessor.FamilyId!.Value,
            WeekendOf = new DateOnly(2026, 5, 9),
            Blocks =
            {
                new ItineraryBlock
                {
                    Id = Guid.NewGuid(),
                    Day = DayOfWeekend.Saturday,
                    Kind = BlockKind.Activity,
                    Title = "Park",
                    Reason = "x",
                    RefId = park.Id,
                    StartTime = new TimeOnly(11, 0),
                    EndTime = new TimeOnly(12, 30)
                }
            }
        });
        await app.Db.SaveChangesAsync();

        var handler = new GetActivitySuggestionsQueryHandler(app.Db, app.FamilyAccessor);
        var fresh = await handler.Handle(new GetActivitySuggestionsQuery(TryNew: true), default);
        fresh.Select(a => a.Id).Should().NotContain(park.Id);
    }

    private static async Task<Activity> Single(TestApp app, string name)
    {
        await Task.Yield();
        return app.Db.Activities.Single(a => a.Name == name);
    }

    private static async Task<TestApp> SeedAsync()
    {
        var app = TestApp.Create();
        var familyId = Guid.NewGuid();
        app.FamilyAccessor.FamilyId = familyId;
        app.Db.Families.Add(new Family { Id = familyId, HomeLocation = "X" });

        app.Db.Activities.AddRange(
            new Activity { Id = Guid.NewGuid(), Name = "Local Park",  Category = "Park",  Indoor = false, MinAge = 0, MaxAge = 99, DriveMinutes = 5,  TypicalDurationMinutes = 90,  Description = "d", MapUrl = "u" },
            new Activity { Id = Guid.NewGuid(), Name = "Rec Room",    Category = "Arcade",Indoor = true,  MinAge = 4, MaxAge = 99, DriveMinutes = 12, TypicalDurationMinutes = 120, Description = "d", MapUrl = "u" },
            new Activity { Id = Guid.NewGuid(), Name = "Faraway Zoo", Category = "Zoo",   Indoor = false, MinAge = 3, MaxAge = 99, DriveMinutes = 50, TypicalDurationMinutes = 300, Description = "d", MapUrl = "u" },
            new Activity { Id = Guid.NewGuid(), Name = "Teen-only Escape Room", Category = "Game", Indoor = true, MinAge = 12, MaxAge = 99, DriveMinutes = 15, TypicalDurationMinutes = 90, Description = "d", MapUrl = "u" });
        await app.Db.SaveChangesAsync();
        return app;
    }
}
