using System.Net.Http.Json;
using System.Text.Json;

namespace Saturdaze.Api.Tests.Admin.EmailTemplates;

/// <summary>Calls the email template endpoints the way Saturdaze Admin does, for the tests that need a template of their own.</summary>
internal static class EmailTemplateApi
{
    public const string Route = "/api/admin/email-templates";

    public static string UniqueKey(string prefix) => $"{prefix}.{Guid.NewGuid():N}"[..Math.Min(prefix.Length + 13, 100)];

    public static Task<HttpResponseMessage> Create(HttpClient client, object body) => client.PostAsJsonAsync(Route, body);

    /// <summary>Creates a template and returns its JSON; throws when the API refuses.</summary>
    public static async Task<JsonElement> CreateOk(HttpClient client, string category = "Notification", string? key = null, string? name = null)
    {
        var res = await Create(client, new { key = key ?? UniqueKey("test"), name = name ?? "Test template", description = "", category });
        var body = await res.Content.ReadAsStringAsync();
        if (!res.IsSuccessStatusCode) throw new InvalidOperationException($"{(int)res.StatusCode}: {body}");
        return JsonDocument.Parse(body).RootElement.Clone();
    }

    public static async Task<JsonElement> Get(HttpClient client, Guid id)
        => JsonDocument.Parse(await client.GetStringAsync($"{Route}/{id}")).RootElement.Clone();

    public static async Task<Guid> IdOf(HttpClient client, string key)
    {
        var rows = JsonDocument.Parse(await client.GetStringAsync($"{Route}?q={Uri.EscapeDataString(key)}")).RootElement;
        return rows.EnumerateArray().Single(r => r.GetProperty("key").GetString() == key).GetProperty("id").GetGuid();
    }
}
