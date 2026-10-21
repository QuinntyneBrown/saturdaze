// Acceptance Test
// Traces to: L2-162
// Description: The branded email layout encodes every value, uses the design tokens and never loads anything.

using FluentAssertions;
using Saturdaze.Application.Email;
using Xunit;

namespace Saturdaze.Application.Tests.Email;

public class EmailLayoutTests
{
    private static EmailContent Content(string title = "A weekend planned for The Riveras") => new(
        Subject: title + " on Saturdaze",
        Eyebrow: "A weekend planned for you",
        Title: title,
        Paragraphs: new[] { "admin@saturdaze.ca planned a sample weekend.", "See Saturday and Sunday in full:" },
        Cta: new EmailCta("Create your account", "https://app.example.com/join?token=abc"),
        Note: new EmailNote("From admin@saturdaze.ca", "Hi Ana, have a look."),
        Sample: new EmailSample("The Riveras", "Sat 16 May – Sun 17 May", "Riverwood Conservancy", "Rec Room Mississauga"),
        Small: "The link works for 14 days.",
        Footer: "Sent to ana@example.com because an administrator invited you.");

    [Fact]
    public void Renders_the_brand_tokens_and_the_call_to_action()
    {
        // Traces to: L2-162 AC1
        var html = EmailLayout.Render(Content());

        html.Should().Contain("<title>A weekend planned for The Riveras on Saturdaze</title>");
        html.Should().Contain("href=\"https://app.example.com/join?token=abc\"");
        html.Should().Contain("Create your account");
        html.Should().Contain("#bf5130").And.Contain("#1f2937").And.Contain("#faf7f2");
        html.Should().Contain("The Riveras · Sat 16 May – Sun 17 May");
        html.Should().Contain("Riverwood Conservancy").And.Contain("Rec Room Mississauga");
        html.Should().Contain("Hi Ana, have a look.");
    }

    [Fact]
    public void Loads_nothing_and_styles_inline_only()
    {
        // Traces to: L2-162 AC5
        var html = EmailLayout.Render(Content());

        html.Should().NotContainEquivalentOf("<script").And.NotContainEquivalentOf("<link")
            .And.NotContainEquivalentOf("<img").And.NotContain("@import").And.NotContainEquivalentOf("<style");
        html.Should().Contain("style=\"");
    }

    [Fact]
    public void Encodes_every_value_that_came_from_a_person()
    {
        // Traces to: L2-162 AC6
        var content = Content("Tom & <b>Jerry</b>") with
        {
            Note = new EmailNote("From <admin>", "a & b <script>alert(1)</script>"),
            Sample = new EmailSample("<Family>", "dates", "A & B", null),
        };

        var html = EmailLayout.Render(content);

        html.Should().Contain("Tom &amp; &lt;b&gt;Jerry&lt;/b&gt;").And.NotContain("<b>Jerry</b>");
        html.Should().Contain("&lt;script&gt;").And.NotContain("<script>");
        html.Should().Contain("&lt;Family&gt;").And.Contain("A &amp; B");
    }

    [Fact]
    public void The_plain_text_twin_carries_the_same_words_and_links()
    {
        // Traces to: L2-162 AC1, AC2
        var text = EmailLayout.Text(Content());

        text.Should().Contain("A weekend planned for The Riveras");
        text.Should().Contain("admin@saturdaze.ca planned a sample weekend.");
        text.Should().Contain("The Riveras · Sat 16 May – Sun 17 May");
        text.Should().Contain("Saturday: Riverwood Conservancy").And.Contain("Sunday: Rec Room Mississauga");
        text.Should().Contain("Hi Ana, have a look.");
        text.Should().Contain("https://app.example.com/join?token=abc");
        text.Should().Contain("The link works for 14 days.");
        text.Should().NotContain("<");
    }
}
