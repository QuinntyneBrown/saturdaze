using System.Net.Http.Json;
using System.Text.Json;

namespace Saturdaze.Api.Tests.Support;

/// <summary>Plans and reads couples' dates (L2-219) the way a client does.</summary>
internal static class DatePlans
{
    public const string WeekendOf = "2026-05-16";

    public static readonly object TwoParentsTwoKids = new
    {
        Members = new[]
        {
            new { Name = "Ada", Age = 41 }, new { Name = "Ben", Age = 39 },
            new { Name = "Cy", Age = 9 }, new { Name = "Di", Age = 5 },
        },
    };

    /// <summary>A family of its own with a planned weekend; the clock is the Thursday before it.</summary>
    public static async Task<(SignedInClient.Session Session, Guid WeekendId)> FamilyWithWeekendAsync(
        SaturdazeApiFactory factory, object? profile = null)
    {
        factory.Clock.Today = new DateOnly(2026, 5, 14);
        var session = await FamilyProfiles.CreateAsync(factory, profile ?? TwoParentsTwoKids);
        var weekend = await Plans.PlanAsync(session.Client, WeekendOf);
        return (session, Plans.Id(weekend));
    }

    public static Task<HttpResponseMessage> PostAsync(HttpClient client, Guid weekendId, object body)
        => client.PostAsJsonAsync($"/api/weekends/{weekendId}/dates", body);

    public static async Task<JsonElement> PlanAsync(HttpClient client, Guid weekendId, object body)
        => await Plans.ReadAsync(await PostAsync(client, weekendId, body));

    public static async Task<JsonElement> ListAsync(HttpClient client, Guid weekendId)
        => await Plans.ReadAsync(await client.GetAsync($"/api/weekends/{weekendId}/dates"));

    public static async Task<Dictionary<string, Guid>> MemberIdsAsync(HttpClient client)
        => (await Plans.ReadAsync(await client.GetAsync("/api/family"))).GetProperty("members").EnumerateArray()
            .ToDictionary(m => m.GetProperty("name").GetString()!, m => m.GetProperty("id").GetGuid());

    public static Guid Id(JsonElement date) => date.GetProperty("id").GetGuid();

    public static IReadOnlyList<JsonElement> Steps(JsonElement date, string? kind = null)
        => date.GetProperty("steps").EnumerateArray()
            .Where(s => kind is null || s.GetProperty("kind").GetString() == kind).ToList();

    public static TimeOnly Start(JsonElement e) => TimeOnly.Parse(e.GetProperty("startTime").GetString()!);

    public static TimeOnly End(JsonElement e) => TimeOnly.Parse(e.GetProperty("endTime").GetString()!);

    public static string RestaurantName(JsonElement date) => date.GetProperty("restaurant").GetProperty("name").GetString()!;

    public static Guid RestaurantId(JsonElement date) => date.GetProperty("restaurant").GetProperty("id").GetGuid();

    public static IReadOnlyList<string> AttendeeNames(JsonElement date)
        => date.GetProperty("attendees").EnumerateArray().Select(a => a.GetProperty("name").GetString()!).ToList();

    public static int Minutes(TimeOnly a, TimeOnly b) => (int)(b - a).TotalMinutes;
}
