// Acceptance Test
// Traces to: L2-128
// Description: POST /api/admin/email-templates/preview renders unsaved Liquid content with sample, built-in or empty values, HTML-encoding values in the HTML body.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Api.Tests.Admin.EmailTemplates;

public class EmailTemplatePreviewTests : IClassFixture<SaturdazeApiFactory>
{
    private const string Route = EmailTemplateApi.Route + "/preview";
    private readonly SaturdazeApiFactory _factory;
    public EmailTemplatePreviewTests(SaturdazeApiFactory factory) => _factory = factory;

    private static object Content(
        string subject = "Hello", string preheader = "", string html = "<p>Hi</p>", string text = "Hi",
        Dictionary<string, object>? samples = null)
        => new { subject, preheader, htmlBody = html, textBody = text, sampleData = samples ?? new Dictionary<string, object>() };

    private async Task<JsonElement> PreviewOk(object content)
    {
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var res = await admin.Client.PostAsJsonAsync(Route, content);
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        return JsonDocument.Parse(body).RootElement.Clone();
    }

    private static JsonElement Placeholder(JsonElement preview, string name)
        => preview.GetProperty("placeholders").EnumerateArray().Single(p => p.GetProperty("name").GetString() == name);

    [Fact]
    public async Task A_sample_value_fills_its_placeholder()
    {
        // Traces to: L2-128 AC1
        var p = await PreviewOk(Content(subject: "Hi {{recipientName}}", samples: new() { ["recipientName"] = "Sam" }));
        p.GetProperty("subject").GetString().Should().Be("Hi Sam");
        Placeholder(p, "recipientName").GetProperty("value").GetString().Should().Be("Sam");
        Placeholder(p, "recipientName").GetProperty("source").GetString().Should().Be("sample");
    }

    [Fact]
    public async Task Values_are_html_encoded_in_the_html_body_only()
    {
        // Traces to: L2-128 AC2
        var p = await PreviewOk(Content(html: "<p>{{note}}</p>", text: "Note: {{ note }}", samples: new() { ["note"] = "<b>bold</b>" }));
        var html = p.GetProperty("html").GetString()!;
        html.Should().Contain("&lt;b&gt;bold&lt;/b&gt;");
        html.Should().NotContain("<b>");
        p.GetProperty("text").GetString().Should().Be("Note: <b>bold</b>");
    }

    [Fact]
    public async Task Built_ins_fill_in_and_unknown_placeholders_render_empty()
    {
        // Traces to: L2-128 AC3
        var p = await PreviewOk(Content(
            subject: "{{appName}} {{giftCode}}",
            preheader: "For {{recipientEmail}}",
            html: "<p>{{giftCode}}</p><a href=\"{{unsubscribeUrl}}\">Unsubscribe</a> {{currentYear}}",
            text: "{{appUrl}}"));
        p.GetProperty("subject").GetString().Should().Be("Saturdaze ");
        p.GetProperty("preheader").GetString().Should().Be("For alex@example.com");
        p.GetProperty("html").GetString().Should().StartWith("<p></p>");
        p.GetProperty("text").GetString().Should().Be("https://app.example.com");

        Placeholder(p, "appName").GetProperty("source").GetString().Should().Be("builtin");
        Placeholder(p, "giftCode").GetProperty("source").GetString().Should().Be("missing");
        Placeholder(p, "giftCode").GetProperty("value").GetString().Should().BeEmpty();
        Placeholder(p, "unsubscribeUrl").GetProperty("value").GetString().Should().StartWith("https://app.example.com/");
        Placeholder(p, "currentYear").GetProperty("value").GetString().Should().MatchRegex("^\\d{4}$");

        p.GetProperty("placeholders").EnumerateArray().Select(x => x.GetProperty("name").GetString())
            .Should().Equal("appName", "giftCode", "recipientEmail", "unsubscribeUrl", "currentYear", "appUrl");
    }

    [Fact]
    public async Task Unsafe_html_and_invalid_liquid_are_refused_as_on_save()
    {
        // Traces to: L2-128
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var unsafeHtml = await admin.Client.PostAsJsonAsync(Route, Content(html: "<img src=x onerror=alert(1)>"));
        unsafeHtml.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        JsonDocument.Parse(await unsafeHtml.Content.ReadAsStringAsync()).RootElement.GetProperty("code").GetString().Should().Be("unsafe_html");

        var malformed = await admin.Client.PostAsJsonAsync(Route, Content(subject: "{{ first name }}"));
        malformed.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        JsonDocument.Parse(await malformed.Content.ReadAsStringAsync()).RootElement.GetProperty("code").GetString().Should().Be("invalid_template");
    }

    [Fact]
    public async Task Conditions_loops_and_filters_render_and_loop_variables_are_not_placeholders()
    {
        // Traces to: L2-128 AC7
        var p = await PreviewOk(Content(
            html: "{% if vip %}<b>VIP</b>{% endif %}<ul>{% for idea in ideas %}<li>{{ idea.name | upcase }}</li>{% endfor %}</ul>",
            samples: new()
            {
                ["vip"] = true,
                ["ideas"] = new[] { new { name = "Kite day" }, new { name = "Pier walk" } },
            }));
        var html = p.GetProperty("html").GetString()!;
        html.Should().Contain("<b>VIP</b>").And.Contain("<li>KITE DAY</li>").And.Contain("<li>PIER WALK</li>");
        p.GetProperty("placeholders").EnumerateArray().Select(x => x.GetProperty("name").GetString())
            .Should().Equal("vip", "ideas");
        Placeholder(p, "vip").GetProperty("value").GetString().Should().Be("true");
        Placeholder(p, "ideas").GetProperty("source").GetString().Should().Be("sample");
        JsonDocument.Parse(Placeholder(p, "ideas").GetProperty("value").GetString()!).RootElement.GetArrayLength().Should().Be(2);
    }

    [Fact]
    public async Task Previewing_requires_an_administrator()
    {
        // Traces to: L2-125 AC1
        (await _factory.CreateClient().PostAsJsonAsync(Route, Content())).StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        var user = await SignedInClient.CreateAsync(_factory);
        (await user.Client.PostAsJsonAsync(Route, Content())).StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
