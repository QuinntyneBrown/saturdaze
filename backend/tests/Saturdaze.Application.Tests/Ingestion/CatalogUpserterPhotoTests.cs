using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Common;
using Saturdaze.Application.Ingestion;
using Saturdaze.Application.Tests.Support;
using Saturdaze.Application.Weather;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Ingestion;

/// <summary>L2-100: ingestion keeps attributed, licensed photos and audits the ones it skips.</summary>
public class CatalogUpserterPhotoTests
{
    private const string ParkWithPhotos = """
        [ {"name":"Bronte Creek","category":"Park","photos":[
            {"url":"https://images.example.com/bronte.jpg","width":1600,"height":900,"alt":"Creek","attribution":"Photo · Ana Lee","license":"CC BY 4.0"},
            {"url":"https://images.example.com/bronte-2.jpg","width":1600,"height":900,"alt":"Trail","attribution":"","license":"CC BY 4.0"}
        ]} ]
        """;

    [Fact]
    public async Task Attributed_photos_are_stored_and_the_first_becomes_primary()
    {
        await using var app = TestApp.Create();
        var items = new IngestionResultParser().Parse(ParkWithPhotos, IngestionType.Activities).Items;

        var result = await new CatalogUpserter(app.Db).UpsertAsync(items, IngestionType.Activities, default);
        await app.Db.SaveChangesAsync();

        var park = await app.Db.Activities.SingleAsync();
        var photo = await app.Db.PlacePhotos.SingleAsync();
        photo.PlaceKind.Should().Be(PlaceKind.Activity);
        photo.PlaceId.Should().Be(park.Id);
        photo.IsPrimary.Should().BeTrue();
        photo.Source.Should().Be(PhotoSource.Provider);
        result.SkipReasons.Should().ContainSingle().Which.Should().Contain("Bronte Creek").And.Contain("attribution");
    }

    [Fact]
    public async Task The_run_audit_records_why_a_photo_was_skipped()
    {
        // Traces to: L2-100 AC2
        await using var app = TestApp.Create();
        var runner = new IngestionRunner(
            new FakeWebSearchClient(new WebSearchResult(ParkWithPhotos, 10, 20, 1)),
            new IngestionResultParser(),
            new CatalogUpserter(app.Db),
            app.Db,
            new FixedClock(new DateTimeOffset(2026, 5, 28, 12, 0, 0, TimeSpan.Zero)),
            Options.Create(new HomeLocationOptions { Name = "Port Credit, Mississauga, ON" }),
            Options.Create(new IngestionOptions { MaxDriveMinutes = 200, MaxRunsPerDayPerType = 48 }),
            NullLogger<IngestionRunner>.Instance);

        await runner.RunAsync(new[] { IngestionType.Activities }, dryRun: false, default);

        var run = await app.Db.IngestionRuns.SingleAsync();
        run.SkipReasons.Should().Contain("attribution");
        run.ItemsUpserted.Should().Be(1);
    }

    [Fact]
    public async Task A_rejected_address_is_skipped_and_the_primary_is_left_alone()
    {
        // Traces to: L2-121 AC1, AC2
        await using var app = TestApp.Create();
        var park = new Activity { Id = Guid.NewGuid(), Name = "Bronte Creek", Category = "Park" };
        app.Db.Activities.Add(park);
        var chosen = PlacePhoto.Create(PlaceKind.Activity, park.Id, "https://images.example.com/chosen.jpg",
            1600, 900, "Chosen", "Photo · Admin", PhotoSource.Curated, "CC BY 4.0", primary: true)!;
        chosen.AdminLocked = true;
        app.Db.PlacePhotos.Add(chosen);
        app.Db.RejectedPlacePhotos.Add(new RejectedPlacePhoto
        {
            Id = Guid.NewGuid(), PlaceKind = PlaceKind.Activity, PlaceId = park.Id,
            Url = "https://images.example.com/bronte.jpg", RejectedAt = DateTimeOffset.UtcNow, RejectedBy = Guid.NewGuid(),
        });
        await app.Db.SaveChangesAsync();
        const string again = """
            [ {"name":"Bronte Creek","category":"Park","photos":[
                {"url":"https://images.example.com/bronte.jpg","width":1600,"height":900,"alt":"Creek","attribution":"Photo · Ana Lee","license":"CC BY 4.0"},
                {"url":"https://images.example.com/bronte-3.jpg","width":1600,"height":900,"alt":"Pond","attribution":"Photo · Ana Lee","license":"CC BY 4.0"}
            ]} ]
            """;
        var items = new IngestionResultParser().Parse(again, IngestionType.Activities).Items;

        var result = await new CatalogUpserter(app.Db).UpsertAsync(items, IngestionType.Activities, default);
        await app.Db.SaveChangesAsync();

        var photos = await app.Db.PlacePhotos.Where(p => p.PlaceId == park.Id).ToListAsync();
        result.SkipReasons.Should().ContainSingle().Which.Should().Contain("bronte.jpg").And.Contain("previously rejected");
        photos.Select(p => p.Url).Should().BeEquivalentTo("https://images.example.com/chosen.jpg", "https://images.example.com/bronte-3.jpg");
        var added = photos.Single(p => p.Url.EndsWith("bronte-3.jpg"));
        added.IsPrimary.Should().BeFalse();
        added.ReviewState.Should().Be(PhotoReviewState.Unreviewed);
        photos.Single(p => p.IsPrimary).Url.Should().EndWith("chosen.jpg", "ingestion never changes a chosen primary");
    }
}
