// Traces to: L2-113
using System.Net;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Admin;

/// <summary>
/// <c>GET /api/admin/places</c>: search, filters, the worst-health-first sort and paging
/// (L2-113). The fixture catalog has places with no photo, a blocked URL, a missing alt
/// text and a healthy primary; an unreviewed provider photo is added where a test needs it.
/// </summary>
public class AdminPlacesListTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private HttpClient _admin = null!;

    public AdminPlacesListTests(SaturdazeApiFactory factory) => _factory = factory;

    public async Task InitializeAsync() => _admin = (await SignedInClient.CreateAsync(_factory, role: UserRole.Admin)).Client;
    public Task DisposeAsync() => Task.CompletedTask;

    private async Task<JsonElement> Get(string query)
    {
        var res = await _admin.GetAsync("/api/admin/places" + query);
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        return JsonDocument.Parse(body).RootElement;
    }

    private static List<string> Names(JsonElement page) =>
        page.GetProperty("items").EnumerateArray().Select(i => i.GetProperty("name").GetString()!).ToList();

    private static List<string> Flags(JsonElement page, string name) =>
        page.GetProperty("items").EnumerateArray().Single(i => i.GetProperty("name").GetString() == name)
            .GetProperty("flags").EnumerateArray().Select(f => f.GetString()!).ToList();

    [Fact]
    public async Task Search_matches_names_in_any_catalog_ignoring_case()
    {
        // Traces to: L2-113 AC1
        var page = await Get("?q=HARBOUR");
        Names(page).Should().Equal("Snug Harbour");
        page.GetProperty("total").GetInt32().Should().Be(1);
    }

    [Fact]
    public async Task Each_place_carries_its_health_flags()
    {
        // Traces to: L2-113
        var page = await Get("");
        Flags(page, "Stratford Festival (family matinee)").Should().Equal("no-photo");
        Flags(page, "Rec Room Mississauga").Should().Equal("blocked-url");
        Flags(page, "Toronto Zoo").Should().Equal("blocked-url");
        Flags(page, "Jack Darling Memorial Park").Should().Equal("missing-alt");
        Flags(page, "Port Credit Memorial Park").Should().BeEmpty();
    }

    [Fact]
    public async Task Default_sort_puts_no_photo_before_blocked_before_unreviewed_before_missing_alt()
    {
        // Traces to: L2-113 AC2
        var photoId = await AddUnreviewedProviderPhotoAsync("Spice Lounge");
        try
        {
            var names = Names(await Get(""));
            var position = names.Select((n, i) => (n, i)).ToDictionary(x => x.n, x => x.i);

            // No photo (alphabetical among themselves) comes first.
            position["Bruce Trail at Rattlesnake Point"].Should().BeLessThan(position["Rec Room Mississauga"]);
            position["Stratford Festival (family matinee)"].Should().BeLessThan(position["Rec Room Mississauga"]);
            position["Bruce Trail at Rattlesnake Point"].Should().BeLessThan(position["Stratford Festival (family matinee)"]);
            // Blocked URL before unreviewed, unreviewed before missing alt, missing alt before healthy.
            position["Rec Room Mississauga"].Should().BeLessThan(position["Spice Lounge"]);
            position["Toronto Zoo"].Should().BeLessThan(position["Spice Lounge"]);
            position["Spice Lounge"].Should().BeLessThan(position["Jack Darling Memorial Park"]);
            position["Jack Darling Memorial Park"].Should().BeLessThan(position["Port Credit Memorial Park"]);
            position["Jack Darling Memorial Park"].Should().BeLessThan(position["Snug Harbour"]);

            Flags(await Get("?q=spice"), "Spice Lounge").Should().Equal("unreviewed");
            Names(await Get("?flag=unreviewed")).Should().Equal("Spice Lounge");
            Names(await Get("?source=Provider")).Should().Equal("Spice Lounge");
        }
        finally
        {
            await RemovePhotoAsync(photoId);
        }
    }

    [Fact]
    public async Task Kind_and_flag_filters_combine()
    {
        // Traces to: L2-113 AC3
        var page = await Get("?kind=Restaurant&flag=no-photo");
        var names = Names(page);
        names.Should().NotContain("Snug Harbour");
        names.Should().Contain("Spice Lounge").And.Contain("Wild Wing");
        names.Should().HaveCount(7);
        page.GetProperty("items").EnumerateArray().Should().OnlyContain(i => i.GetProperty("kind").GetString() == "Restaurant");

        Names(await Get("?flag=missing-alt")).Should().Equal("Jack Darling Memorial Park");
        Names(await Get("?flag=blocked-url")).Should().BeEquivalentTo("Rec Room Mississauga", "Toronto Zoo");
        Names(await Get("?source=Curated")).Should().Contain("Port Credit Memorial Park").And.NotContain("Stratford Festival (family matinee)");
    }

    [Fact]
    public async Task Upcoming_keeps_only_events_starting_today_or_later()
    {
        // Traces to: L2-113
        var today = _factory.Clock.Today;
        _factory.Clock.Today = new DateOnly(2026, 7, 1);
        try
        {
            var names = Names(await Get("?upcoming=true"));
            names.Should().Contain("Port Credit Buskerfest");
            names.Should().NotContain("Mississauga Waterfront Festival").And.NotContain("Terre Bleu Lavender Bloom Weekends");
            names.Should().Contain("Snug Harbour", "upcoming only narrows events; other catalogs stay");
        }
        finally
        {
            _factory.Clock.Today = today;
        }
    }

    [Fact]
    public async Task Sort_by_name_is_alphabetical_and_pages_hold_fifty()
    {
        // Traces to: L2-113 AC4
        var page = await Get("?sort=name");
        var names = Names(page);
        names.Should().BeInAscendingOrder(StringComparer.OrdinalIgnoreCase);
        page.GetProperty("pageSize").GetInt32().Should().Be(50);
        page.GetProperty("page").GetInt32().Should().Be(1);
        page.GetProperty("total").GetInt32().Should().Be(names.Count);

        var second = await Get("?page=2");
        second.GetProperty("page").GetInt32().Should().Be(2);
        second.GetProperty("total").GetInt32().Should().Be(names.Count);
        second.GetProperty("items").GetArrayLength().Should().Be(Math.Max(0, names.Count - 50));
    }

    [Fact]
    public async Task Unknown_filter_values_are_400()
    {
        var res = await _admin.GetAsync("/api/admin/places?flag=sideways");
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        res = await _admin.GetAsync("/api/admin/places?kind=Castle");
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private async Task<Guid> AddUnreviewedProviderPhotoAsync(string restaurantName)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var place = await db.Restaurants.SingleAsync(r => r.Name == restaurantName);
        var photo = PlacePhoto.Create(PlaceKind.Restaurant, place.Id, "https://images.example.com/spice.jpg",
            1200, 675, "Dining room", "Photo · Provider", PhotoSource.Provider, "Provider terms", primary: true)!;
        photo.ReviewState = PhotoReviewState.Unreviewed;
        db.PlacePhotos.Add(photo);
        await db.SaveChangesAsync();
        return photo.Id;
    }

    private async Task RemovePhotoAsync(Guid id)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.PlacePhotos.Where(p => p.Id == id).ExecuteDeleteAsync();
    }
}
