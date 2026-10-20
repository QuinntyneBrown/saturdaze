using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace Saturdaze.Api.Tests.Support;

/// <summary>Wire helpers for prospects: a prospective family with a sample weekend (L2-159, L2-160).</summary>
internal static class Prospects
{
    public static object Riveras(DateOnly? weekendOf = null, string familyName = "The Riveras") => new
    {
        FamilyName = familyName,
        HomeLocation = "Lakeview, Mississauga, ON",
        Members = new[] { new { Name = "Dani", Age = 38 }, new { Name = "Mateo", Age = 7 } },
        Likes = new[] { "parks" },
        WeekendOf = weekendOf,
    };

    public static async Task<JsonElement> CreateAsync(HttpClient admin, object? payload = null, DateOnly? weekendOf = null)
    {
        var response = await admin.PostAsJsonAsync("/api/admin/prospects", payload ?? Riveras(weekendOf));
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.Created, body);
        return JsonDocument.Parse(body).RootElement;
    }

    public static async Task<JsonElement> GetAsync(HttpClient admin, Guid id)
    {
        var response = await admin.GetAsync($"/api/admin/prospects/{id}");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        return JsonDocument.Parse(body).RootElement;
    }

    public static IEnumerable<JsonElement> Blocks(JsonElement prospect)
        => prospect.GetProperty("weekend").GetProperty("blocks").EnumerateArray();

    public static JsonElement FirstBlockOfKind(JsonElement prospect, string kind)
        => Blocks(prospect).First(b => b.GetProperty("kind").GetString() == kind);

    public static async Task<JsonElement> LockAsync(HttpClient admin, Guid prospectId, Guid blockId, bool locked)
    {
        var response = await admin.PutAsJsonAsync($"/api/admin/prospects/{prospectId}/blocks/{blockId}/lock", new { Locked = locked });
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        return JsonDocument.Parse(body).RootElement;
    }

    public static async Task<HttpResponseMessage> SwapAsync(HttpClient admin, Guid prospectId, Guid blockId)
        => await admin.PostAsync($"/api/admin/prospects/{prospectId}/blocks/{blockId}/swap", null);

    public static async Task<HttpResponseMessage> RegenerateAsync(HttpClient admin, Guid prospectId)
        => await admin.PostAsync($"/api/admin/prospects/{prospectId}/weekend/regenerate", null);

    public static JsonElement Block(JsonElement weekend, Guid id)
        => weekend.GetProperty("blocks").EnumerateArray().Single(b => b.GetProperty("id").GetGuid() == id);
}
