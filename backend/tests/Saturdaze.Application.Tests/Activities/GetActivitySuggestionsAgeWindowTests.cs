// Traces to: L2-017 #2
using FluentAssertions;
using Saturdaze.Application.Activities;
using Saturdaze.Application.Tests.Support;
using Saturdaze.Domain.Entities;
using Xunit;

namespace Saturdaze.Application.Tests.Activities;

public class GetActivitySuggestionsAgeWindowTests
{
    [Fact]
    public async Task Min_age_alone_excludes_activities_that_top_out_below_it()
    {
        await using var app = TestApp.Create();
        app.Db.Activities.AddRange(
            new Activity { Id = Guid.NewGuid(), Name = "Toddler Gym", Category = "Play", MinAge = 1, MaxAge = 4,
                           DriveMinutes = 5, TypicalDurationMinutes = 60, WeatherTags = new() { "rain" }, Description = "d", MapUrl = "u" },
            new Activity { Id = Guid.NewGuid(), Name = "Family Park", Category = "Park", MinAge = 0, MaxAge = 99,
                           DriveMinutes = 5, TypicalDurationMinutes = 90, WeatherTags = new() { "sunny" }, Description = "d", MapUrl = "u" });
        await app.Db.SaveChangesAsync();
        var handler = new GetActivitySuggestionsQueryHandler(app.Db, app.FamilyAccessor);

        var results = await handler.Handle(new GetActivitySuggestionsQuery(MinAge: 9), default);

        results.Select(a => a.Name).Should().Equal("Family Park");
    }

    [Fact]
    public async Task Max_age_alone_excludes_activities_that_start_above_it()
    {
        await using var app = TestApp.Create();
        app.Db.Activities.AddRange(
            new Activity { Id = Guid.NewGuid(), Name = "Teen Escape Room", Category = "Game", MinAge = 12, MaxAge = 99,
                           DriveMinutes = 5, TypicalDurationMinutes = 60, WeatherTags = new() { "rain" }, Description = "d", MapUrl = "u" },
            new Activity { Id = Guid.NewGuid(), Name = "Family Park", Category = "Park", MinAge = 0, MaxAge = 99,
                           DriveMinutes = 5, TypicalDurationMinutes = 90, WeatherTags = new() { "sunny" }, Description = "d", MapUrl = "u" });
        await app.Db.SaveChangesAsync();
        var handler = new GetActivitySuggestionsQueryHandler(app.Db, app.FamilyAccessor);

        var results = await handler.Handle(new GetActivitySuggestionsQuery(MaxAge: 5), default);

        results.Select(a => a.Name).Should().Equal("Family Park");
    }
}
