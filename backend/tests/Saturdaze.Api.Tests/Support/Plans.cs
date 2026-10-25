using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace Saturdaze.Api.Tests.Support;

/// <summary>Reads planned weekends as JSON, the way a client sees them.</summary>
internal static class Plans
{
    public static async Task<JsonElement> ReadAsync(HttpResponseMessage response)
    {
        var body = await response.Content.ReadAsStringAsync();
        response.IsSuccessStatusCode.Should().BeTrue(body);
        return JsonDocument.Parse(body).RootElement.Clone();
    }

    public static async Task<JsonElement> PlanAsync(HttpClient client, string weekendOf)
        => await ReadAsync(await client.PostAsJsonAsync("/api/weekends/plan", new { WeekendOf = weekendOf }));

    public static Guid Id(JsonElement weekend) => weekend.GetProperty("id").GetGuid();

    public static IReadOnlyList<JsonElement> Blocks(JsonElement weekend) =>
        weekend.GetProperty("blocks").EnumerateArray().ToList();

    public static IReadOnlyList<JsonElement> Blocks(JsonElement weekend, string day) =>
        Blocks(weekend).Where(b => b.GetProperty("day").GetString() == day).ToList();

    public static IReadOnlyList<JsonElement> OfKind(JsonElement weekend, string kind, string? day = null) =>
        (day is null ? Blocks(weekend) : Blocks(weekend, day))
            .Where(b => b.GetProperty("kind").GetString() == kind).ToList();

    public static TimeOnly Start(JsonElement block) => TimeOnly.Parse(block.GetProperty("startTime").GetString()!);

    public static TimeOnly End(JsonElement block) => TimeOnly.Parse(block.GetProperty("endTime").GetString()!);

    public static string Kind(JsonElement block) => block.GetProperty("kind").GetString()!;

    /// <summary>Great-circle kilometres between two <c>{ latitude, longitude }</c> objects; enough to rank by distance.</summary>
    public static double Km(JsonElement a, JsonElement b)
    {
        static double Rad(double d) => d * Math.PI / 180;
        var (lat1, lng1) = (a.GetProperty("latitude").GetDouble(), a.GetProperty("longitude").GetDouble());
        var (lat2, lng2) = (b.GetProperty("latitude").GetDouble(), b.GetProperty("longitude").GetDouble());
        var h = Math.Pow(Math.Sin(Rad(lat2 - lat1) / 2), 2)
                + Math.Cos(Rad(lat1)) * Math.Cos(Rad(lat2)) * Math.Pow(Math.Sin(Rad(lng2 - lng1) / 2), 2);
        return 2 * 6371 * Math.Asin(Math.Sqrt(h));
    }

    public static string Title(JsonElement block) => block.GetProperty("title").GetString()!;

    public static string Reason(JsonElement block) => block.GetProperty("reason").GetString()!;

    public static Guid? RefId(JsonElement block) =>
        block.GetProperty("refId").ValueKind == JsonValueKind.Null ? null : block.GetProperty("refId").GetGuid();

    /// <summary>What a block is, without its id: for comparing two reads of one weekend.</summary>
    public static (string Day, string Start, string End, string Kind, string Title) Shape(JsonElement b) =>
        (b.GetProperty("day").GetString()!, b.GetProperty("startTime").GetString()!, b.GetProperty("endTime").GetString()!,
            b.GetProperty("kind").GetString()!, b.GetProperty("title").GetString()!);
}
