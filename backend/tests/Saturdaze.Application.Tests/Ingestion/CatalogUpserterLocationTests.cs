using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Application.Ingestion;
using Saturdaze.Application.Tests.Support;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Ingestion;

/// <summary>L2-087: ingestion populates the location of each place it upserts.</summary>
public class CatalogUpserterLocationTests
{
    private static readonly IngestionResultParser Parser = new();

    [Fact]
    public async Task Each_catalog_type_stores_the_ingested_location()
    {
        await using var app = TestApp.Create();
        var sut = new CatalogUpserter(app.Db);

        await sut.UpsertAsync(Parser.Parse(
            """[ {"name":"Bronte Creek","category":"Park","latitude":43.4096,"longitude":-79.7646,"address":"1219 Burloak Dr, Oakville, ON"} ]""",
            IngestionType.Activities).Items, IngestionType.Activities, default);
        await sut.UpsertAsync(Parser.Parse(
            """[ {"name":"Snug Harbour","style":"Seafood","slot":"Dinner","latitude":43.5498,"longitude":-79.5853,"address":"14 Stavebank Rd S"} ]""",
            IngestionType.Restaurants).Items, IngestionType.Restaurants, default);
        await sut.UpsertAsync(Parser.Parse(
            """[ {"name":"Tulip Festival","startsOn":"2026-05-16","location":"RBG","latitude":43.29,"longitude":-79.8763,"address":"680 Plains Rd W"} ]""",
            IngestionType.Events).Items, IngestionType.Events, default);
        await app.Db.SaveChangesAsync();

        (await app.Db.Activities.SingleAsync()).Geo!.Latitude.Should().Be(43.4096m);
        (await app.Db.Restaurants.SingleAsync()).Geo!.Address.Should().Be("14 Stavebank Rd S");
        (await app.Db.LocalEvents.SingleAsync()).Geo!.Longitude.Should().Be(-79.8763m);
    }

    [Fact]
    public async Task Out_of_range_or_missing_coordinates_store_no_location()
    {
        await using var app = TestApp.Create();
        var sut = new CatalogUpserter(app.Db);

        await sut.UpsertAsync(Parser.Parse(
            """
            [
              {"name":"Nowhere Park","category":"Park","latitude":91,"longitude":-79.7,"address":"x"},
              {"name":"Half Park","category":"Park","latitude":43.4}
            ]
            """,
            IngestionType.Activities).Items, IngestionType.Activities, default);
        await app.Db.SaveChangesAsync();

        (await app.Db.Activities.Where(a => a.Geo != null).CountAsync()).Should().Be(0);
        (await app.Db.Activities.CountAsync()).Should().Be(2);
    }
}
