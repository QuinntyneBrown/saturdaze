// Acceptance Test
// Traces to: L2-162 AC4
// Description: Every message leaves as multipart/alternative, plain text first, then HTML.

using FluentAssertions;
using Microsoft.Extensions.Options;
using MimeKit;
using Saturdaze.Application.Email;
using Saturdaze.Infrastructure.Email;
using Xunit;

namespace Saturdaze.Infrastructure.Tests.Email;

public sealed class MultipartTests : IDisposable
{
    private readonly string _dir = Path.Combine(Path.GetTempPath(), "saturdaze-mail-" + Guid.NewGuid().ToString("N"));

    public void Dispose()
    {
        if (Directory.Exists(_dir)) Directory.Delete(_dir, recursive: true);
    }

    [Fact]
    public async Task Given_a_message_with_an_html_part_when_written_then_the_eml_is_multipart_alternative()
    {
        var sender = new PickupDirectoryEmailSender(Options.Create(new EmailOptions { PickupDirectory = _dir }));

        await sender.SendAsync(
            new EmailMessage("parent@example.com", "Confirm your email", "Plain words https://app.example.com/verify", "<html><body>Rich words</body></html>"),
            CancellationToken.None);

        var mime = await MimeMessage.LoadAsync(Directory.GetFiles(_dir, "*.eml").Single());
        var body = mime.Body.Should().BeOfType<MultipartAlternative>().Subject;
        body.Count.Should().Be(2);
        body[0].ContentType.MimeType.Should().Be("text/plain");
        body[1].ContentType.MimeType.Should().Be("text/html");
        mime.TextBody.Should().Contain("https://app.example.com/verify");
        mime.HtmlBody.Should().Contain("Rich words");
    }

    [Fact]
    public async Task Given_a_message_without_an_html_part_when_written_then_the_eml_stays_plain_text()
    {
        var sender = new PickupDirectoryEmailSender(Options.Create(new EmailOptions { PickupDirectory = _dir }));

        await sender.SendAsync(new EmailMessage("parent@example.com", "Hello", "Plain words"), CancellationToken.None);

        var mime = await MimeMessage.LoadAsync(Directory.GetFiles(_dir, "*.eml").Single());
        mime.Body!.ContentType.MimeType.Should().Be("text/plain");
    }
}
