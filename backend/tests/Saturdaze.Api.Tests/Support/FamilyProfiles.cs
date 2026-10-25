using System.Net.Http.Json;
using System.Text.Json;

namespace Saturdaze.Api.Tests.Support;

/// <summary>Sets up a family's profile through <c>PUT /api/family</c>, as the family page does.</summary>
internal static class FamilyProfiles
{
    /// <summary>Dislikes that leave only the Rec Room in the test catalog.</summary>
    public static readonly string[] OnlyRecRoom =
        { "Park", "Animals", "Theatre", "Hike", "Outdoor", "Museum", "Skating", "Library" };

    public static async Task<JsonElement> SaveAsync(HttpClient client, object profile)
        => await Plans.ReadAsync(await client.PutAsJsonAsync("/api/family", profile));

    public static object Dislikes(params string[] values) =>
        values.Select(v => new { Kind = "Dislike", Value = v }).ToArray();

    /// <summary>A fresh family of its own, saved with the given parts.</summary>
    public static async Task<SignedInClient.Session> CreateAsync(SaturdazeApiFactory factory, object profile)
    {
        var session = await SignedInClient.CreateAsync(factory, FamilyMode.Own);
        await SaveAsync(session.Client, profile);
        return session;
    }
}
