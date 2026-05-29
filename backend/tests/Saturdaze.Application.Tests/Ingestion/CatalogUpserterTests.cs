using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Ingestion;
using Saturdaze.Application.Tests.Support;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Ingestion;

public class CatalogUpserterTests
{
    private static readonly IngestionResultParser Parser = new();

    [Fact]
    public async Task Inserts_new_events()
    {
        await using var app = TestApp.Create();
        var sut = new CatalogUpserter(app.Db);
        var items = Parser.Parse("""
            [
              {"name":"Tulip Festival","startsOn":"2026-05-16","endsOn":"2026-05-17","location":"RBG","driveMinutes":35,"url":"https://rbg.ca","category":"Festival"},
              {"name":"Farmers Market","startsOn":"2026-05-17","endsOn":"2026-05-17","location":"Lakeshore","driveMinutes":2,"category":"Local"}
            ]
            """, IngestionType.Events).Items;

        var result = await sut.UpsertAsync(items, IngestionType.Events, default);

        result.Inserted.Should().Be(2);
        result.Updated.Should().Be(0);
        (await app.Db.LocalEvents.CountAsync()).Should().Be(2);
        var tulip = await app.Db.LocalEvents.SingleAsync(e => e.Name == "Tulip Festival");
        tulip.EndsOn.Should().Be(new DateOnly(2026, 5, 17));
        tulip.DriveMinutes.Should().Be(35);
    }

    [Fact]
    public async Task Re_upserting_the_same_event_updates_in_place()
    {
        await using var app = TestApp.Create();
        var sut = new CatalogUpserter(app.Db);

        await sut.UpsertAsync(Parser.Parse(
            """[ {"name":"Tulip Festival","startsOn":"2026-05-16","endsOn":"2026-05-16","location":"RBG","category":"Festival"} ]""",
            IngestionType.Events).Items, IngestionType.Events, default);

        // Same natural key (name|date|location), new end date + category.
        var result = await sut.UpsertAsync(Parser.Parse(
            """[ {"name":"Tulip Festival","startsOn":"2026-05-16","endsOn":"2026-05-18","location":"RBG","category":"Seasonal"} ]""",
            IngestionType.Events).Items, IngestionType.Events, default);

        result.Inserted.Should().Be(0);
        result.Updated.Should().Be(1);
        (await app.Db.LocalEvents.CountAsync()).Should().Be(1);
        var ev = await app.Db.LocalEvents.SingleAsync();
        ev.EndsOn.Should().Be(new DateOnly(2026, 5, 18));
        ev.Category.Should().Be("Seasonal");
    }

    [Fact]
    public async Task Activities_dedupe_on_name()
    {
        await using var app = TestApp.Create();
        var sut = new CatalogUpserter(app.Db);

        await sut.UpsertAsync(Parser.Parse(
            """[ {"name":"Bronte Creek","category":"Park","indoor":false,"minAge":5,"maxAge":99,"weatherTags":["sunny","mild"]} ]""",
            IngestionType.Activities).Items, IngestionType.Activities, default);
        var result = await sut.UpsertAsync(Parser.Parse(
            """[ {"name":"Bronte Creek","category":"Outdoor","indoor":false,"weatherTags":["warm"]} ]""",
            IngestionType.Activities).Items, IngestionType.Activities, default);

        result.Updated.Should().Be(1);
        (await app.Db.Activities.CountAsync()).Should().Be(1);
        var a = await app.Db.Activities.SingleAsync();
        a.Category.Should().Be("Outdoor");
        a.WeatherTags.Should().Equal("warm");
    }

    [Fact]
    public async Task Restaurants_dedupe_on_name_and_slot()
    {
        await using var app = TestApp.Create();
        var sut = new CatalogUpserter(app.Db);

        // Same name, different slot => two distinct rows.
        var items = Parser.Parse("""
            [
              {"name":"Symposium","slot":"Lunch","style":"Brunch","wifeApproved":true,"driveMinutes":9},
              {"name":"Symposium","slot":"Dinner","style":"Brunch","wifeApproved":true,"driveMinutes":9}
            ]
            """, IngestionType.Restaurants).Items;

        var result = await sut.UpsertAsync(items, IngestionType.Restaurants, default);

        result.Inserted.Should().Be(2);
        (await app.Db.Restaurants.CountAsync()).Should().Be(2);
        (await app.Db.Restaurants.SingleAsync(r => r.Slot == MealSlot.Dinner)).Name.Should().Be("Symposium");
    }

    [Fact]
    public async Task Rejects_rows_whose_key_field_exceeds_the_column_length()
    {
        await using var app = TestApp.Create();
        var sut = new CatalogUpserter(app.Db);
        var longName = new string('x', 250); // Activity.Name cap is 160
        var items = Parser.Parse(
            $$"""[ {"name":"{{longName}}","category":"Park"} ]""",
            IngestionType.Activities).Items;

        var result = await sut.UpsertAsync(items, IngestionType.Activities, default);

        result.Inserted.Should().Be(0);
        result.Rejected.Should().Be(1);
        (await app.Db.Activities.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Truncates_over_long_descriptive_fields_rather_than_rejecting()
    {
        await using var app = TestApp.Create();
        var sut = new CatalogUpserter(app.Db);
        var longDescription = new string('d', 3000); // Activity.Description cap is 2000
        var items = Parser.Parse(
            $$"""[ {"name":"Trail","category":"Park","description":"{{longDescription}}"} ]""",
            IngestionType.Activities).Items;

        var result = await sut.UpsertAsync(items, IngestionType.Activities, default);

        result.Inserted.Should().Be(1);
        (await app.Db.Activities.SingleAsync()).Description.Length.Should().Be(2000);
    }

    [Fact]
    public async Task Empty_batch_writes_nothing()
    {
        await using var app = TestApp.Create();
        var sut = new CatalogUpserter(app.Db);
        var result = await sut.UpsertAsync(Array.Empty<IngestionItem>(), IngestionType.Events, default);
        result.Should().Be(UpsertResult.Empty);
    }
}
