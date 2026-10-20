using System.Net.Http.Json;
using System.Text.Json;

namespace Saturdaze.Api.Tests.Support;

/// <summary>Creates one live suggestion for a signed-in client through the real search route, with the fakes scripted.</summary>
public static class PhotoSuggestionSeeder
{
    public sealed record Seeded(string Id, string PreviewUrl);

    public static async Task<Seeded> SuggestAsync(
        SaturdazeApiFactory factory,
        HttpClient client,
        byte[] imageBytes,
        string attribution = "Photo · Terre Bleu Lavender Farm",
        string licence = "CC BY-SA 4.0",
        string title = "Lavender rows",
        string sourceUrl = "https://commons.wikimedia.org/wiki/File:Lavender.jpg")
    {
        var imageUrl = $"https://upload.wikimedia.org/{Guid.NewGuid():N}.jpg";
        factory.PublicImages.Responses[imageUrl] = imageBytes;
        factory.Search.Fail = false;
        factory.Search.RawText =
            $$"""[{ "imageUrl": "{{imageUrl}}", "title": "{{title}}", "sourceName": "Wikimedia Commons", "sourceUrl": "{{sourceUrl}}", "attribution": "{{attribution}}", "licence": "{{licence}}" }]""";

        var res = await client.PostAsJsonAsync("/api/photo-suggestions", new { target = "profile", query = "lavender rows" });
        var body = await res.Content.ReadAsStringAsync();
        if (!res.IsSuccessStatusCode) throw new InvalidOperationException($"Suggestion search failed: {res.StatusCode} {body}");
        var first = JsonDocument.Parse(body).RootElement.GetProperty("suggestions")[0];
        return new Seeded(first.GetProperty("id").GetString()!, first.GetProperty("previewUrl").GetString()!);
    }
}
