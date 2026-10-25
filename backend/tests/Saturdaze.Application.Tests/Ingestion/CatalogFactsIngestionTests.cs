// Acceptance Test
// Traces to: L2-199 AC1, AC2, AC3, AC4
// Description: Ingestion stores the richer catalog facts, verifies the source and tags themes.

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Ingestion;
using Saturdaze.Application.Tests.Support;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Ingestion;

public class CatalogFactsIngestionTests
{
    private static readonly IngestionResultParser Parser = new();

    private static async Task<TestApp> IngestAsync(string json, IngestionType type)
    {
        var app = TestApp.Create();
        var parsed = Parser.Parse(json, type);
        await new CatalogUpserter(app.Db).UpsertAsync(parsed.Items, type, default);
        return app;
    }

    [Fact]
    public async Task An_event_keeps_its_times_and_themes()
    {
        // Traces to: L2-199 AC1
        await using var app = await IngestAsync("""
            [{"name":"Lantern Walk","startsOn":"2026-10-31","endsOn":"2026-10-31","location":"Kariya Park",
              "driveMinutes":12,"url":"https://example.com/lanterns","category":"Community","indoor":false,
              "startTime":"18:00","endTime":"20:00","priceTier":0,"minAge":3,"maxAge":12,"themes":["halloween"]}]
            """, IngestionType.Events);

        var e = await app.Db.LocalEvents.SingleAsync();
        e.StartTime.Should().Be(new TimeOnly(18, 0));
        e.EndTime.Should().Be(new TimeOnly(20, 0));
        e.PriceTier.Should().Be(0);
        (e.MinAge, e.MaxAge).Should().Be((3, 12));
        e.Themes.Should().Equal("halloween");
    }

    [Fact]
    public async Task An_activity_keeps_its_hours_season_price_and_source()
    {
        // Traces to: L2-199 AC1
        await using var app = await IngestAsync("""
            [{"name":"Berry Farm","category":"Farm","indoor":false,"minAge":0,"maxAge":99,"driveMinutes":30,
              "weatherTags":["sunny"],"typicalDurationMinutes":120,"description":"Pick berries.","mapUrl":"https://maps.example.com/b",
              "opensAt":"10:00","closesAt":"17:00","seasonStartMonth":6,"seasonEndMonth":8,"priceTier":1,
              "sourceUrl":"https://berries.example.com"}]
            """, IngestionType.Activities);

        var a = await app.Db.Activities.SingleAsync();
        (a.OpensAt, a.ClosesAt).Should().Be((new TimeOnly(10, 0), new TimeOnly(17, 0)));
        (a.SeasonStartMonth, a.SeasonEndMonth).Should().Be((6, 8));
        a.PriceTier.Should().Be(1);
        a.SourceUrl.Should().Be("https://berries.example.com");
    }

    [Theory]
    [InlineData("")]
    [InlineData(",\"url\":\"http://example.com/fair\"")]
    [InlineData(",\"url\":\"not a url\"")]
    public void An_event_without_an_https_source_is_rejected(string url)
    {
        // Traces to: L2-199 AC2
        var result = Parser.Parse($$"""
            [{"name":"Fair","startsOn":"2026-10-31","location":"Here"{{url}}}]
            """, IngestionType.Events);

        result.Items.Should().BeEmpty();
        result.Rejected.Should().Be(1);
    }

    [Fact]
    public void An_activity_without_an_https_source_is_rejected()
    {
        // Traces to: L2-199 AC2
        var result = Parser.Parse("""
            [{"name":"Park","category":"Park","sourceUrl":"http://park.example.com"},
             {"name":"Trail","category":"Hike"}]
            """, IngestionType.Activities);

        result.Items.Should().BeEmpty();
        result.Rejected.Should().Be(2);
    }

    [Fact]
    public async Task Invalid_optional_facts_are_dropped_but_the_row_is_kept()
    {
        // Traces to: L2-199 AC3
        await using var app = await IngestAsync("""
            [{"name":"Odd Event","startsOn":"2026-10-31","location":"Here","url":"https://example.com/odd",
              "startTime":"20:00","endTime":"18:00","priceTier":7,"minAge":12,"maxAge":3,"themes":["birthdays","halloween"]}]
            """, IngestionType.Events);

        var e = await app.Db.LocalEvents.SingleAsync();
        e.StartTime.Should().BeNull();
        e.EndTime.Should().BeNull();
        e.PriceTier.Should().BeNull();
        e.MinAge.Should().BeNull();
        e.MaxAge.Should().BeNull();
        e.Themes.Should().Equal("halloween");
    }

    [Fact]
    public async Task A_themed_event_is_tagged_even_when_the_model_says_nothing()
    {
        // Traces to: L2-199 AC4
        await using var app = await IngestAsync("""
            [{"name":"Park your Pumpkin","startsOn":"2026-10-31","location":"Port Credit","url":"https://example.com/pumpkin"}]
            """, IngestionType.Events);

        (await app.Db.LocalEvents.SingleAsync()).Themes.Should().Contain("halloween");
    }
}
