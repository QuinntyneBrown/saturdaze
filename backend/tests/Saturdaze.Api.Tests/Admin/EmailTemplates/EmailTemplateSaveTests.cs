// Acceptance Test
// Traces to: L2-127
// Description: PUT /api/admin/email-templates/{id} saves content with a version check and refuses unsafe HTML, invalid Liquid and dropped required variables.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Api.Tests.Admin.EmailTemplates;

public class EmailTemplateSaveTests : IClassFixture<SaturdazeApiFactory>
{
    private readonly SaturdazeApiFactory _factory;
    public EmailTemplateSaveTests(SaturdazeApiFactory factory) => _factory = factory;

    private Task<SignedInClient.Session> Admin() => SignedInClient.CreateAsync(_factory, role: UserRole.Admin);

    /// <summary>The template's current content as a PUT body, with the given changes.</summary>
    private static Dictionary<string, object?> Body(JsonElement t, Action<Dictionary<string, object?>>? change = null)
    {
        var body = new Dictionary<string, object?>
        {
            ["name"] = t.GetProperty("name").GetString(),
            ["description"] = t.GetProperty("description").GetString(),
            ["subject"] = t.GetProperty("subject").GetString(),
            ["preheader"] = t.GetProperty("preheader").GetString(),
            ["htmlBody"] = t.GetProperty("htmlBody").GetString(),
            ["textBody"] = t.GetProperty("textBody").GetString(),
            ["sampleData"] = t.GetProperty("sampleData").Clone(),
            ["version"] = t.GetProperty("version").GetInt32(),
        };
        change?.Invoke(body);
        return body;
    }

    private static Task<HttpResponseMessage> Put(HttpClient client, JsonElement t, Dictionary<string, object?> body)
        => client.PutAsJsonAsync($"{EmailTemplateApi.Route}/{t.GetProperty("id").GetGuid()}", body);

    private static async Task<string?> Code(HttpResponseMessage res)
        => JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement.TryGetProperty("code", out var c) ? c.GetString() : null;

    [Fact]
    public async Task Saving_increments_the_version_and_records_who_and_when()
    {
        // Traces to: L2-127 AC1
        var admin = await Admin();
        var t = await EmailTemplateApi.CreateOk(admin.Client);
        var res = await Put(admin.Client, t, Body(t, b =>
        {
            b["subject"] = "Your plan for {{weekendDates}}";
            b["sampleData"] = new Dictionary<string, string> { ["weekendDates"] = "11 and 12 October" };
            b["key"] = "attempt.to-change-key";
            b["category"] = "Marketing";
        }));
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);

        var saved = JsonDocument.Parse(body).RootElement;
        saved.GetProperty("subject").GetString().Should().Be("Your plan for {{weekendDates}}");
        saved.GetProperty("version").GetInt32().Should().Be(2);
        saved.GetProperty("updatedByEmail").GetString().Should().Be(admin.Email);
        saved.GetProperty("updatedAt").GetDateTimeOffset().Offset.Should().Be(TimeSpan.Zero);
        saved.GetProperty("sampleData").GetProperty("weekendDates").GetString().Should().Be("11 and 12 October");
        saved.GetProperty("key").GetString().Should().Be(t.GetProperty("key").GetString());
        saved.GetProperty("category").GetString().Should().Be("Notification");
        saved.GetProperty("status").GetString().Should().Be("Draft");

        var again = await Put(admin.Client, saved, Body(saved, b => b["preheader"] = "Third save"));
        JsonDocument.Parse(await again.Content.ReadAsStringAsync()).RootElement.GetProperty("version").GetInt32().Should().Be(3);
    }

    [Fact]
    public async Task A_stale_version_is_409_template_stale_and_changes_nothing()
    {
        // Traces to: L2-127 AC2
        var admin = await Admin();
        var t = await EmailTemplateApi.CreateOk(admin.Client);
        (await Put(admin.Client, t, Body(t, b => b["subject"] = "First"))).StatusCode.Should().Be(HttpStatusCode.OK);

        var stale = await Put(admin.Client, t, Body(t, b => b["subject"] = "Second"));
        stale.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await Code(stale)).Should().Be("template_stale");

        var current = await EmailTemplateApi.Get(admin.Client, t.GetProperty("id").GetGuid());
        current.GetProperty("subject").GetString().Should().Be("First");
        current.GetProperty("version").GetInt32().Should().Be(2);
    }

    [Theory]
    [InlineData("<p>Hi</p><img src=x onerror=alert(1)>")]
    [InlineData("<p>Hi</p><script>alert(1)</script>")]
    [InlineData("<p>Hi</p><iframe src=\"https://example.com\"></iframe>")]
    [InlineData("<a href=\"javascript:alert(1)\">Open</a>")]
    [InlineData("<a href=\"JaVaScRiPt :alert(1)\">Open</a>")]
    [InlineData("<form action=\"https://example.com\"><input></form>")]
    [InlineData("<object data=\"x\"></object>")]
    [InlineData("<a href=\"data:text/html;base64,PHNjcmlwdD4=\">Open</a>")]
    public async Task Unsafe_html_is_400_unsafe_html(string html)
    {
        // Traces to: L2-127 AC3
        var admin = await Admin();
        var t = await EmailTemplateApi.CreateOk(admin.Client);
        var res = await Put(admin.Client, t, Body(t, b => b["htmlBody"] = html));
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await Code(res)).Should().Be("unsafe_html");
    }

    [Fact]
    public async Task Ordinary_text_that_mentions_on_or_javascript_is_allowed()
    {
        // Traces to: L2-127 AC3
        var admin = await Admin();
        var t = await EmailTemplateApi.CreateOk(admin.Client);
        var res = await Put(admin.Client, t, Body(t, b =>
            b["htmlBody"] = "<p>Come online = fun. We teach javascript: the language.</p><p style=\"color:#333\">Hi {{recipientName}}</p>"));
        res.StatusCode.Should().Be(HttpStatusCode.OK, await res.Content.ReadAsStringAsync());
    }

    [Theory]
    [InlineData("subject", "Subject", "Hi {{ first name }}")]
    [InlineData("subject", "Subject", "Hi {{}}")]
    [InlineData("textBody", "Plain-text body", "Hi {{recipientName}")]
    [InlineData("htmlBody", "HTML body", "<p>{% if %}</p>")]
    [InlineData("preheader", "Preheader", "{% for %}")]
    public async Task Invalid_liquid_is_400_invalid_template_naming_the_field_and_position(string field, string label, string value)
    {
        // Traces to: L2-127 AC4, L2-131 AC1
        var admin = await Admin();
        var t = await EmailTemplateApi.CreateOk(admin.Client);
        var res = await Put(admin.Client, t, Body(t, b => b[field] = value));
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement;
        problem.GetProperty("code").GetString().Should().Be("invalid_template");
        problem.GetProperty("detail").GetString().Should().StartWith(label + ":").And.MatchRegex(@"\(\d+:\d+\)");
    }

    [Fact]
    public async Task A_system_template_keeps_its_link_in_both_bodies()
    {
        // Traces to: L2-127 AC5
        var admin = await Admin();
        var t = await EmailTemplateApi.Get(admin.Client, await EmailTemplateApi.IdOf(admin.Client, "account.password-reset"));
        t.GetProperty("requiredPlaceholders").EnumerateArray().Select(p => p.GetString()).Should().Equal("resetLink");

        var res = await Put(admin.Client, t, Body(t, b => b["textBody"] = "Hi {{recipientName}}, open the app to reset."));
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await Code(res)).Should().Be("missing_placeholder");
        JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement.GetProperty("detail").GetString()
            .Should().Contain("resetLink");
    }

    [Fact]
    public async Task A_required_variable_used_through_a_filter_counts()
    {
        // Traces to: L2-127 AC5
        var admin = await Admin();
        var t = await EmailTemplateApi.Get(admin.Client, await EmailTemplateApi.IdOf(admin.Client, "account.password-reset"));
        var res = await Put(admin.Client, t, Body(t, b =>
        {
            b["htmlBody"] = "<p><a href=\"{{ resetLink | escape }}\">Reset</a></p>";
            b["textBody"] = "Reset: {{ resetLink }}";
        }));
        res.StatusCode.Should().Be(HttpStatusCode.OK, await res.Content.ReadAsStringAsync());

        // Put the seeded content back for the other tests.
        var saved = JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement;
        (await Put(admin.Client, saved, Body(saved, b =>
        {
            b["htmlBody"] = t.GetProperty("htmlBody").GetString();
            b["textBody"] = t.GetProperty("textBody").GetString();
        }))).StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task A_marketing_template_keeps_its_unsubscribe_link()
    {
        // Traces to: L2-127 AC5
        var admin = await Admin();
        var t = await EmailTemplateApi.CreateOk(admin.Client, category: "Marketing");
        var res = await Put(admin.Client, t, Body(t, b => b["htmlBody"] = "<p>Big news</p>"));
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await Code(res)).Should().Be("missing_placeholder");
    }

    [Fact]
    public async Task An_unknown_id_is_404_and_an_overlong_subject_is_a_field_error()
    {
        // Traces to: L2-127 AC6
        var admin = await Admin();
        var t = await EmailTemplateApi.CreateOk(admin.Client);
        var missing = await admin.Client.PutAsJsonAsync($"{EmailTemplateApi.Route}/{Guid.NewGuid()}", Body(t));
        missing.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var res = await Put(admin.Client, t, Body(t, b => b["subject"] = new string('s', 201)));
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        JsonDocument.Parse(await res.Content.ReadAsStringAsync()).RootElement.GetProperty("errors")
            .EnumerateObject().Select(p => p.Name).Should().Contain("subject");
    }
}
