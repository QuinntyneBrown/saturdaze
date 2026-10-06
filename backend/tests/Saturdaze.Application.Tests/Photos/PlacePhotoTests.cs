using FluentAssertions;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Application.Tests.Photos;

/// <summary>L2-100: provenance is mandatory and a place has exactly one primary photo.</summary>
public class PlacePhotoTests
{
    private static PlacePhoto Photo(Guid placeId, bool primary) =>
        PlacePhoto.Create(PlaceKind.Activity, placeId, "https://images.example.com/x.jpg", 1200, 675,
            "Alt", "Photo · Jo Doe", PhotoSource.Curated, "CC BY 4.0", primary)!;

    [Fact]
    public void Marking_a_third_photo_primary_leaves_exactly_one_primary()
    {
        // Traces to: L2-100 AC1
        var place = Guid.NewGuid();
        var photos = new List<PlacePhoto> { Photo(place, true), Photo(place, false), Photo(place, false) };

        PlacePhotoSet.MarkPrimary(photos, photos[2].Id);

        photos.Count(p => p.IsPrimary).Should().Be(1);
        photos[2].IsPrimary.Should().BeTrue();
    }

    [Theory]
    [InlineData("", "CC BY 4.0")]
    [InlineData("Photo · Jo Doe", " ")]
    public void A_photo_without_attribution_or_licence_is_not_created(string attribution, string license)
    {
        // Traces to: L2-100
        PlacePhoto.Create(PlaceKind.Activity, Guid.NewGuid(), "https://images.example.com/x.jpg", 1200, 675,
                "Alt", attribution, PhotoSource.Provider, license, primary: true)
            .Should().BeNull();
    }
}
