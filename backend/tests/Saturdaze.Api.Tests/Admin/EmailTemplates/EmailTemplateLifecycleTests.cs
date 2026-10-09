// Acceptance Test
// Traces to: L2-135
// Description: POST .../status moves a template between Draft, Active and Archived with a version check; system templates stay active and cannot be deleted; DELETE removes a non-system template.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;
using Xunit;

namespace Saturdaze.Api.Tests.Admin.EmailTemplates;

public class EmailTemplateLifecycleTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    public EmailTemplateLifecycleTests(SaturdazeApiFactory factory) => _factory = factory;

    private Task<SignedInClient.Session> Admin() => SignedInClient.CreateAsync(_factory, role: UserRole.Admin);

    private static Task<HttpResponseMessage> SetStatus(HttpClient client, Guid id, string status, int version)
        => client.PostAsJsonAsync($"{EmailTemplateApi.Route}/{id}/status", new { status, version });

    private static async Task<JsonElement> Json(HttpResponseMessage res)
        => JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement.Clone();

    [Fact]
    public async Task Activating_a_draft_increments_its_version()
    {
        // Traces to: L2-135 AC1
        var admin = await Admin();
        var t = await EmailTemplateApi.CreateOk(admin.Client);
        var id = t.GetProperty("id").GetGuid();

        var res = await SetStatus(admin.Client, id, "Active", 1);
        res.StatusCode.Should().Be(HttpStatusCode.OK, await res.Content.ReadAsStringAsync());
        var active = await Json(res);
        active.GetProperty("status").GetString().Should().Be("Active");
        active.GetProperty("version").GetInt32().Should().Be(2);
        active.GetProperty("updatedByEmail").GetString().Should().Be(admin.Email);
    }

    [Fact]
    public async Task A_system_template_stays_active_and_cannot_be_deleted()
    {
        // Traces to: L2-135 AC2
        var admin = await Admin();
        var id = await EmailTemplateApi.IdOf(admin.Client, "account.verify-email");
        var version = (await EmailTemplateApi.Get(admin.Client, id)).GetProperty("version").GetInt32();

        foreach (var status in new[] { "Archived", "Draft" })
        {
            var res = await SetStatus(admin.Client, id, status, version);
            res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
            (await Json(res)).GetProperty("code").GetString().Should().Be("system_template");
        }

        var delete = await admin.Client.DeleteAsync($"{EmailTemplateApi.Route}/{id}");
        delete.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await Json(delete)).GetProperty("code").GetString().Should().Be("system_template");

        (await EmailTemplateApi.Get(admin.Client, id)).GetProperty("status").GetString().Should().Be("Active");
    }

    [Fact]
    public async Task An_archived_template_can_be_restored_as_a_draft()
    {
        // Traces to: L2-135 AC3
        var admin = await Admin();
        var id = (await EmailTemplateApi.CreateOk(admin.Client)).GetProperty("id").GetGuid();
        (await SetStatus(admin.Client, id, "Active", 1)).StatusCode.Should().Be(HttpStatusCode.OK);
        (await SetStatus(admin.Client, id, "Archived", 2)).StatusCode.Should().Be(HttpStatusCode.OK);

        var res = await SetStatus(admin.Client, id, "Draft", 3);
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        (await Json(res)).GetProperty("status").GetString().Should().Be("Draft");
    }

    [Fact]
    public async Task A_stale_version_or_unknown_status_is_refused()
    {
        // Traces to: L2-135
        var admin = await Admin();
        var id = (await EmailTemplateApi.CreateOk(admin.Client)).GetProperty("id").GetGuid();

        var stale = await SetStatus(admin.Client, id, "Active", 7);
        stale.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await Json(stale)).GetProperty("code").GetString().Should().Be("template_stale");

        var unknown = await SetStatus(admin.Client, id, "Published", 1);
        unknown.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await Json(unknown)).GetProperty("errors").EnumerateObject().Select(p => p.Name).Should().Contain("status");
    }

    [Fact]
    public async Task Deleting_removes_the_template_and_its_revisions()
    {
        // Traces to: L2-135 AC4
        var admin = await Admin();
        var id = (await EmailTemplateApi.CreateOk(admin.Client)).GetProperty("id").GetGuid();

        var res = await admin.Client.DeleteAsync($"{EmailTemplateApi.Route}/{id}");
        res.StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await admin.Client.GetAsync($"{EmailTemplateApi.Route}/{id}")).StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await admin.Client.DeleteAsync($"{EmailTemplateApi.Route}/{id}")).StatusCode.Should().Be(HttpStatusCode.NotFound);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.EmailTemplateRevisions.CountAsync(r => r.TemplateId == id)).Should().Be(0);
    }

    [Fact]
    public async Task Status_changes_and_deletes_require_an_administrator()
    {
        // Traces to: L2-131 AC1
        var admin = await Admin();
        var id = (await EmailTemplateApi.CreateOk(admin.Client)).GetProperty("id").GetGuid();
        var user = await SignedInClient.CreateAsync(_factory);
        (await SetStatus(user.Client, id, "Active", 1)).StatusCode.Should().Be(HttpStatusCode.Forbidden);
        (await user.Client.DeleteAsync($"{EmailTemplateApi.Route}/{id}")).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
