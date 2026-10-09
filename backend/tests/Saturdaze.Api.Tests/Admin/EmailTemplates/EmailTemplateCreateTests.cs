// Acceptance Test
// Traces to: L2-126, L2-127 AC6
// Description: POST /api/admin/email-templates creates a draft from the category's starter or from a duplicated template, and GET returns it.
using System.Net;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Api.Tests.Admin.EmailTemplates;

public class EmailTemplateCreateTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    public EmailTemplateCreateTests(SaturdazeApiFactory factory) => _factory = factory;

    private Task<SignedInClient.Session> Admin() => SignedInClient.CreateAsync(_factory, role: UserRole.Admin);

    [Fact]
    public async Task Creates_a_draft_at_version_1_with_starter_content()
    {
        // Traces to: L2-126 AC1
        var admin = await Admin();
        var res = await EmailTemplateApi.Create(admin.Client,
            new { key = "notify.weekend-ready", name = "Weekend ready", description = "When a plan is ready", category = "Notification" });
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.Created, body);
        res.Headers.Location.Should().NotBeNull();

        var t = JsonDocument.Parse(body).RootElement;
        t.GetProperty("key").GetString().Should().Be("notify.weekend-ready");
        t.GetProperty("name").GetString().Should().Be("Weekend ready");
        t.GetProperty("description").GetString().Should().Be("When a plan is ready");
        t.GetProperty("category").GetString().Should().Be("Notification");
        t.GetProperty("status").GetString().Should().Be("Draft");
        t.GetProperty("version").GetInt32().Should().Be(1);
        t.GetProperty("isSystem").GetBoolean().Should().BeFalse();
        t.GetProperty("subject").GetString().Should().NotBeNullOrWhiteSpace();
        t.GetProperty("htmlBody").GetString().Should().NotBeNullOrWhiteSpace();
        t.GetProperty("textBody").GetString().Should().NotBeNullOrWhiteSpace();
        t.GetProperty("createdByEmail").GetString().Should().Be(admin.Email);
        t.GetProperty("updatedByEmail").GetString().Should().Be(admin.Email);

        var fetched = await EmailTemplateApi.Get(admin.Client, t.GetProperty("id").GetGuid());
        fetched.GetProperty("key").GetString().Should().Be("notify.weekend-ready");
        fetched.GetProperty("requiredPlaceholders").GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task A_marketing_starter_carries_the_unsubscribe_link_in_both_bodies()
    {
        // Traces to: L2-126 AC2
        var admin = await Admin();
        var t = await EmailTemplateApi.CreateOk(admin.Client, category: "Marketing");
        t.GetProperty("htmlBody").GetString().Should().Contain("{{unsubscribeUrl}}");
        t.GetProperty("textBody").GetString().Should().Contain("{{unsubscribeUrl}}");
        t.GetProperty("requiredPlaceholders").EnumerateArray().Select(p => p.GetString()).Should().Equal("unsubscribeUrl");
    }

    [Fact]
    public async Task Duplicating_copies_the_content_into_a_new_non_system_draft()
    {
        // Traces to: L2-126 AC3
        var admin = await Admin();
        var sourceId = await EmailTemplateApi.IdOf(admin.Client, "account.verify-email");
        var source = await EmailTemplateApi.Get(admin.Client, sourceId);

        var res = await EmailTemplateApi.Create(admin.Client,
            new { key = "account.verify-email-copy", name = "Copy of Verify your email", category = "Account", duplicateOf = sourceId });
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.Created, body);

        var copy = JsonDocument.Parse(body).RootElement;
        copy.GetProperty("key").GetString().Should().Be("account.verify-email-copy");
        copy.GetProperty("isSystem").GetBoolean().Should().BeFalse();
        copy.GetProperty("status").GetString().Should().Be("Draft");
        copy.GetProperty("subject").GetString().Should().Be(source.GetProperty("subject").GetString());
        copy.GetProperty("htmlBody").GetString().Should().Be(source.GetProperty("htmlBody").GetString());
        copy.GetProperty("textBody").GetString().Should().Be(source.GetProperty("textBody").GetString());
        copy.GetProperty("sampleData").GetProperty("verificationLink").GetString().Should()
            .Be(source.GetProperty("sampleData").GetProperty("verificationLink").GetString());
    }

    [Fact]
    public async Task An_existing_key_is_409_template_key_exists()
    {
        // Traces to: L2-126 AC4
        var admin = await Admin();
        var res = await EmailTemplateApi.Create(admin.Client,
            new { key = "account.password-reset", name = "Another reset", category = "Account" });
        res.StatusCode.Should().Be(HttpStatusCode.Conflict);
        JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement.GetProperty("code").GetString()
            .Should().Be("template_key_exists");
    }

    [Theory]
    [InlineData("Bad Key!", "Name", "Notification", "key")]
    [InlineData("good.key", "", "Notification", "name")]
    [InlineData("good.key", "Name", "Newsletter", "category")]
    public async Task A_malformed_key_empty_name_or_unknown_category_is_400_naming_the_field(
        string key, string name, string category, string field)
    {
        // Traces to: L2-126 AC4
        var admin = await Admin();
        var res = await EmailTemplateApi.Create(admin.Client, new { key, name, category });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var errors = JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement.GetProperty("errors");
        errors.EnumerateObject().Select(p => p.Name).Should().Contain(field);
    }

    [Fact]
    public async Task Duplicating_an_unknown_template_is_404_and_an_unknown_id_is_404()
    {
        // Traces to: L2-126, L2-127 AC6
        var admin = await Admin();
        var res = await EmailTemplateApi.Create(admin.Client,
            new { key = "dup.unknown", name = "Dup", category = "Notification", duplicateOf = Guid.NewGuid() });
        res.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var get = await admin.Client.GetAsync($"{EmailTemplateApi.Route}/{Guid.NewGuid()}");
        get.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Creating_requires_an_administrator()
    {
        // Traces to: L2-125 AC1
        var user = await SignedInClient.CreateAsync(_factory);
        var res = await EmailTemplateApi.Create(user.Client, new { key = "x.y", name = "X", category = "Notification" });
        res.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
