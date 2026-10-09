// Acceptance Test
// Traces to: L2-136
// Description: every create, save and status change writes a revision; the history lists them newest first and returns one revision's content.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Api.Tests.Admin.EmailTemplates;

public class EmailTemplateRevisionTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    public EmailTemplateRevisionTests(SaturdazeApiFactory factory) => _factory = factory;

    private static async Task<JsonElement> Save(HttpClient client, JsonElement t, string subject)
    {
        var res = await client.PutAsJsonAsync($"{EmailTemplateApi.Route}/{t.GetProperty("id").GetGuid()}", new
        {
            name = t.GetProperty("name").GetString(),
            description = t.GetProperty("description").GetString(),
            subject,
            preheader = t.GetProperty("preheader").GetString(),
            htmlBody = t.GetProperty("htmlBody").GetString(),
            textBody = t.GetProperty("textBody").GetString(),
            sampleData = JsonSerializer.Deserialize<Dictionary<string, string>>(t.GetProperty("sampleData").GetRawText()),
            version = t.GetProperty("version").GetInt32(),
        });
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        return JsonDocument.Parse(body).RootElement.Clone();
    }

    [Fact]
    public async Task Create_two_saves_and_an_activation_list_four_revisions_newest_first()
    {
        // Traces to: L2-136 AC1, AC2
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var t = await EmailTemplateApi.CreateOk(admin.Client);
        var id = t.GetProperty("id").GetGuid();
        var firstSubject = t.GetProperty("subject").GetString();
        t = await Save(admin.Client, t, "Second subject");
        t = await Save(admin.Client, t, "Third subject");
        (await admin.Client.PostAsJsonAsync($"{EmailTemplateApi.Route}/{id}/status", new { status = "Active", version = 3 }))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        var list = JsonDocument.Parse(await admin.Client.GetStringAsync($"{EmailTemplateApi.Route}/{id}/revisions")).RootElement;
        var rows = list.EnumerateArray().ToList();
        rows.Select(r => r.GetProperty("version").GetInt32()).Should().Equal(4, 3, 2, 1);
        rows.Select(r => r.GetProperty("action").GetString()).Should().Equal("status", "edit", "edit", "create");
        rows.Select(r => r.GetProperty("status").GetString()).Should().Equal("Active", "Draft", "Draft", "Draft");
        rows.Should().OnlyContain(r => r.GetProperty("adminEmail").GetString() == admin.Email);
        rows.Should().OnlyContain(r => r.GetProperty("occurredAt").GetDateTimeOffset().Offset == TimeSpan.Zero);
        rows[1].GetProperty("subject").GetString().Should().Be("Third subject");

        var v2 = JsonDocument.Parse(await admin.Client.GetStringAsync($"{EmailTemplateApi.Route}/{id}/revisions/2")).RootElement;
        v2.GetProperty("version").GetInt32().Should().Be(2);
        v2.GetProperty("subject").GetString().Should().Be("Second subject");
        v2.GetProperty("htmlBody").GetString().Should().Be(t.GetProperty("htmlBody").GetString());
        v2.GetProperty("textBody").GetString().Should().NotBeNullOrEmpty();
        v2.TryGetProperty("sampleData", out _).Should().BeTrue();

        var v1 = JsonDocument.Parse(await admin.Client.GetStringAsync($"{EmailTemplateApi.Route}/{id}/revisions/1")).RootElement;
        v1.GetProperty("subject").GetString().Should().Be(firstSubject);
    }

    [Fact]
    public async Task The_seeded_first_revision_names_the_seeder()
    {
        // Traces to: L2-136
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var id = await EmailTemplateApi.IdOf(admin.Client, "account.password-reset");
        var rows = JsonDocument.Parse(await admin.Client.GetStringAsync($"{EmailTemplateApi.Route}/{id}/revisions")).RootElement
            .EnumerateArray().ToList();
        rows.Last().GetProperty("version").GetInt32().Should().Be(1);
        rows.Last().GetProperty("action").GetString().Should().Be("create");
        rows.Last().GetProperty("adminEmail").GetString().Should().Be("Saturdaze");
    }

    [Fact]
    public async Task An_unknown_version_or_template_is_404()
    {
        // Traces to: L2-136 AC3
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var id = (await EmailTemplateApi.CreateOk(admin.Client)).GetProperty("id").GetGuid();
        (await admin.Client.GetAsync($"{EmailTemplateApi.Route}/{id}/revisions/9")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await admin.Client.GetAsync($"{EmailTemplateApi.Route}/{Guid.NewGuid()}/revisions")).StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
