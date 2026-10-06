// Traces to: L2-116
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Admin;

/// <summary>
/// <c>POST /api/admin/places/{kind}/{id}/photos</c> as JSON: only an HTTPS URL on an allowed origin,
/// fetched once to verify the type and size, saved as a curated photo (L2-116).
/// </summary>
public class AdminAddPhotoUrlTests : IClassFixture<SaturdazeApiFactory>, IAsyncLifetime
{
    private readonly SaturdazeApiFactory _factory;
    private SignedInClient.Session _admin = null!;

    public AdminAddPhotoUrlTests(SaturdazeApiFactory factory) => _factory = factory;

    public async Task InitializeAsync() => _admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
    public Task DisposeAsync() => Task.CompletedTask;

    private record AddRequest(string? Url, string? Alt, string? Attribution, string? Licence);

    private async Task<Guid> ActivityId(string name)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return (await db.Activities.SingleAsync(a => a.Name == name)).Id;
    }

    private Task<HttpResponseMessage> Add(Guid placeId, string? url, string attribution = "Photo · City", string licence = "CC BY 4.0") =>
        _admin.Client.PostAsJsonAsync($"/api/admin/places/Activity/{placeId}/photos", new AddRequest(url, "Alt", attribution, licence));

    private static async Task<string?> Code(HttpResponseMessage res)
    {
        var body = JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement;
        return body.TryGetProperty("code", out var code) ? code.GetString() : null;
    }

    [Fact]
    public async Task Http_or_a_non_allowed_origin_is_refused_before_anything_is_fetched()
    {
        // Traces to: L2-116 AC1
        var placeId = await ActivityId("Ontario Science Centre");
        var fetched = _factory.Images.Requested.Count;

        var res = await Add(placeId, "http://images.example.com/osc.jpg");
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await Code(res)).Should().Be("url_not_allowed");

        res = await Add(placeId, "https://elsewhere.example.net/osc.jpg");
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await Code(res)).Should().Be("url_not_allowed");

        _factory.Images.Requested.Count.Should().Be(fetched, "a refused address is never fetched");
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.PlacePhotos.CountAsync(p => p.PlaceId == placeId)).Should().Be(0);
    }

    [Fact]
    public async Task An_allowed_url_that_returns_html_or_nothing_is_unsupported()
    {
        // Traces to: L2-116 AC2, AC5
        var placeId = await ActivityId("Ontario Science Centre");
        _factory.Images.Responses["https://images.example.com/page.html"] = Encoding.UTF8.GetBytes("<!doctype html><html><body>no</body></html>");

        var res = await Add(placeId, "https://images.example.com/page.html");
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await Code(res)).Should().Be("unsupported_image");

        res = await Add(placeId, "https://images.example.com/unreachable-or-too-big.jpg");
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await Code(res)).Should().Be("unsupported_image");
    }

    [Fact]
    public async Task An_allowed_jpeg_is_saved_with_its_real_size_and_duplicates_are_409()
    {
        // Traces to: L2-116 AC3, AC4
        var placeId = await ActivityId("Royal Ontario Museum");
        const string url = "https://images.example.com/rom-hall.jpg";
        _factory.Images.Responses[url] = TestPhotos.Jpeg(width: 1200, height: 675);

        var res = await Add(placeId, url);
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.Created, body);
        var dto = JsonDocument.Parse(body).RootElement;
        dto.GetProperty("url").GetString().Should().Be(url, "the source URL is stored, not a copy");
        dto.GetProperty("width").GetInt32().Should().Be(1200);
        dto.GetProperty("height").GetInt32().Should().Be(675);
        dto.GetProperty("source").GetString().Should().Be("Curated");
        dto.GetProperty("reviewState").GetString().Should().Be("Reviewed");
        dto.GetProperty("adminLocked").GetBoolean().Should().BeTrue();
        dto.GetProperty("isPrimary").GetBoolean().Should().BeTrue("the place had no photo");
        dto.GetProperty("blocked").GetBoolean().Should().BeFalse();

        res = await Add(placeId, url);
        res.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await Code(res)).Should().Be("photo_exists");
    }

    [Fact]
    public async Task Missing_url_attribution_or_licence_is_a_field_error()
    {
        // Traces to: L2-116
        var placeId = await ActivityId("Royal Ontario Museum");
        var res = await Add(placeId, null);
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await res.Content.ReadAsStringAsync()).Should().Contain("url");

        res = await Add(placeId, "https://images.example.com/x.jpg", attribution: "");
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await res.Content.ReadAsStringAsync()).Should().Contain("attribution");
    }
}
