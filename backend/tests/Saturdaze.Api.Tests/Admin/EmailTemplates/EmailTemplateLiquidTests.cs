// Acceptance Test
// Traces to: L2-131
// Description: Templates are Liquid rendered with Fluid under a restricted profile: no unknown filters, no include or render, no raw in the HTML body, a step limit, and JSON object sample data.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Saturdaze.Api.Tests.Support;
using Saturdaze.Domain.Enums;
using Xunit;

namespace Saturdaze.Api.Tests.Admin.EmailTemplates;

public class EmailTemplateLiquidTests : IClassFixture<SaturdazeApiFactory>
{
    private const string Route = EmailTemplateApi.Route + "/preview";
    private readonly SaturdazeApiFactory _factory;
    public EmailTemplateLiquidTests(SaturdazeApiFactory factory) => _factory = factory;

    private static object Content(
        string subject = "Hello", string html = "<p>Hi</p>", string text = "Hi", object? samples = null)
        => new { subject, preheader = "", htmlBody = html, textBody = text, sampleData = samples ?? new Dictionary<string, object>() };

    private async Task<HttpResponseMessage> Preview(object content)
    {
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        return await admin.Client.PostAsJsonAsync(Route, content);
    }

    private static async Task<JsonElement> Problem(HttpResponseMessage res, string code)
    {
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest, body);
        var problem = JsonDocument.Parse(body).RootElement.Clone();
        problem.GetProperty("code").GetString().Should().Be(code, body);
        return problem;
    }

    [Fact]
    public async Task A_syntax_error_names_the_field_line_and_column()
    {
        // Traces to: L2-131 AC1
        var problem = await Problem(await Preview(Content(subject: "Hi {{ first name }}")), "invalid_template");
        problem.GetProperty("detail").GetString().Should().StartWith("Subject:").And.MatchRegex(@"\(1:\d+\)");
    }

    [Fact]
    public async Task An_unknown_filter_is_refused_by_name()
    {
        // Traces to: L2-131 AC2
        var problem = await Problem(await Preview(Content(html: "<p>{{ note | shout }}</p>")), "invalid_template");
        problem.GetProperty("detail").GetString().Should().StartWith("HTML body:").And.Contain("shout");
    }

    [Theory]
    [InlineData("{% include 'footer' %}")]
    [InlineData("{% render 'footer' %}")]
    public async Task Include_and_render_are_refused(string body)
    {
        // Traces to: L2-131 AC3
        await Problem(await Preview(Content(text: body)), "invalid_template");
    }

    [Fact]
    public async Task Raw_is_refused_in_the_html_body_and_allowed_in_the_text_body()
    {
        // Traces to: L2-131 AC4
        await Problem(await Preview(Content(html: "<p>{{ note | raw }}</p>")), "unsafe_html");

        var res = await Preview(Content(text: "{{ note | raw }}", samples: new Dictionary<string, object> { ["note"] = "<b>x</b>" }));
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        JsonDocument.Parse(body).RootElement.GetProperty("text").GetString().Should().Be("<b>x</b>");
    }

    [Fact]
    public async Task A_template_that_takes_too_many_steps_is_refused()
    {
        // Traces to: L2-131 AC5
        var problem = await Problem(await Preview(Content(text: "{% for i in (1..100000) %}{{ i }}{% endfor %}")), "invalid_template");
        problem.GetProperty("detail").GetString().Should().StartWith("Plain-text body:").And.Contain("too many steps");
    }

    public static TheoryData<string> BadSampleData() => new()
    {
        "[1, 2]",
        "\"text\"",
        "{ \"first name\": \"Sam\" }",
        "{ \"1st\": \"Sam\" }",
        $"{{ \"note\": \"{new string('x', 20_001)}\" }}",
    };

    [Theory]
    [MemberData(nameof(BadSampleData))]
    public async Task Sample_data_must_be_a_small_object_of_liquid_names(string sampleData)
    {
        // Traces to: L2-131 AC6
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var json = $$"""{ "subject": "Hi", "preheader": "", "htmlBody": "<p>Hi</p>", "textBody": "Hi", "sampleData": {{sampleData}} }""";
        var res = await admin.Client.PostAsync(Route, new StringContent(json, System.Text.Encoding.UTF8, "application/json"));
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest, body);
        body.Should().Contain("sampleData");
    }

    [Theory]
    [InlineData("account.verify-email", "verificationLink")]
    [InlineData("account.password-reset", "resetLink")]
    public async Task The_seeded_system_templates_render_unchanged(string key, string link)
    {
        // Traces to: L2-131 AC7
        var admin = await SignedInClient.CreateAsync(_factory, role: UserRole.Admin);
        var t = await EmailTemplateApi.Get(admin.Client, await EmailTemplateApi.IdOf(admin.Client, key));
        var sample = t.GetProperty("sampleData").GetProperty(link).GetString()!;

        var res = await admin.Client.PostAsJsonAsync(Route, new
        {
            subject = t.GetProperty("subject").GetString(),
            preheader = t.GetProperty("preheader").GetString(),
            htmlBody = t.GetProperty("htmlBody").GetString(),
            textBody = t.GetProperty("textBody").GetString(),
            sampleData = t.GetProperty("sampleData"),
        });
        var body = await res.Content.ReadAsStringAsync();
        res.StatusCode.Should().Be(HttpStatusCode.OK, body);
        var p = JsonDocument.Parse(body).RootElement;
        p.GetProperty("text").GetString().Should().Contain(sample).And.NotContain("{{");
        p.GetProperty("html").GetString().Should().Contain(System.Net.WebUtility.HtmlEncode(sample)).And.NotContain("{{");
    }
}
