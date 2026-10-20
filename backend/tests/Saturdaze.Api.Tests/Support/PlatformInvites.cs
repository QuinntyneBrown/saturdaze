using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace Saturdaze.Api.Tests.Support;

/// <summary>
/// Wire helpers for platform invitations (L2-157): an administrator sends
/// them from Saturdaze Admin and an invitee joins through the join link.
/// </summary>
internal static class PlatformInvites
{
    public const string Password = "Passw0rd!";

    public static string NewEmail(string prefix = "family") => $"{prefix}-{Guid.NewGuid():N}@example.com";

    /// <summary>Sends invitations and returns the 201 body's <c>invitations</c> array.</summary>
    public static async Task<List<JsonElement>> SendAsync(HttpClient admin, object? prospectId = null, string? message = null, params string[] emails)
    {
        var response = await admin.PostAsJsonAsync("/api/admin/invitations", new { Emails = emails, ProspectId = prospectId, Message = message });
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.Created, body);
        return JsonDocument.Parse(body).RootElement.GetProperty("invitations").EnumerateArray().ToList();
    }

    public static async Task<JsonElement> SendOneAsync(HttpClient admin, string email, object? prospectId = null)
        => (await SendAsync(admin, prospectId, null, email)).Single();

    /// <summary>The raw token from an invitation's join link.</summary>
    public static string TokenOf(JsonElement invitation)
    {
        var url = invitation.GetProperty("url").GetString()!;
        var marker = "/join?token=";
        var at = url.IndexOf(marker, StringComparison.Ordinal);
        at.Should().BeGreaterThan(0, url);
        return Uri.UnescapeDataString(url[(at + marker.Length)..]);
    }

    public static async Task<HttpResponseMessage> PreviewAsync(HttpClient anonymous, string token)
        => await anonymous.PostAsJsonAsync("/api/auth/join", new { Token = token });

    public static async Task<HttpResponseMessage> AcceptAsync(HttpClient anonymous, string token, string password = Password)
        => await anonymous.PostAsJsonAsync("/api/auth/join/accept", new { Token = token, Password = password });

    public static async Task<JsonElement> ListAsync(HttpClient admin)
    {
        var response = await admin.GetAsync("/api/admin/invitations");
        var body = await response.Content.ReadAsStringAsync();
        response.StatusCode.Should().Be(HttpStatusCode.OK, body);
        return JsonDocument.Parse(body).RootElement;
    }

    public static JsonElement Row(JsonElement list, string email)
        => list.EnumerateArray().Single(i => i.GetProperty("email").GetString() == email);

    public static string? CodeOf(string body)
    {
        var root = JsonDocument.Parse(body).RootElement;
        return root.TryGetProperty("code", out var code) ? code.GetString() : null;
    }
}
