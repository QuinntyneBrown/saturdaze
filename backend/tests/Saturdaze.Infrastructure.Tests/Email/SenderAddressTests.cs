// Acceptance Test
// Traces to: L2-155 AC5
// Description: Mail leaves from the saturdaze.ca domain (ADR-018).

using FluentAssertions;
using System.Text.Json;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Email;
using Saturdaze.Infrastructure.Email;
using Xunit;

namespace Saturdaze.Infrastructure.Tests.Email;

public sealed class SenderAddressTests : IDisposable
{
    private const string Expected = "Saturdaze <no-reply@saturdaze.ca>";
    private readonly string _dir = Path.Combine(Path.GetTempPath(), "saturdaze-mail-" + Guid.NewGuid().ToString("N"));

    public void Dispose()
    {
        if (Directory.Exists(_dir)) Directory.Delete(_dir, recursive: true);
    }

    [Fact]
    public void Given_the_API_settings_then_mail_is_sent_from_no_reply_at_saturdaze_ca()
    {
        using var settings = JsonDocument.Parse(File.ReadAllText(ApiSettingsFile()));
        var from = settings.RootElement.GetProperty("Saturdaze").GetProperty("Email").GetProperty("From").GetString();

        from.Should().Be(Expected);
    }

    private static string ApiSettingsFile()
    {
        for (var dir = new DirectoryInfo(AppContext.BaseDirectory); dir is not null; dir = dir.Parent)
        {
            var candidate = Path.Combine(dir.FullName, "src", "Saturdaze.Api", "appsettings.json");
            if (File.Exists(candidate)) return candidate;
        }
        throw new FileNotFoundException("backend/src/Saturdaze.Api/appsettings.json not found above the test output.");
    }

    [Fact]
    public async Task Given_the_default_options_when_a_message_is_written_then_it_is_from_no_reply_at_saturdaze_ca()
    {
        var sender = new PickupDirectoryEmailSender(Options.Create(new EmailOptions { PickupDirectory = _dir }));

        await sender.SendAsync(new EmailMessage("parent@example.com", "Verify your email", "Hello"), CancellationToken.None);

        var eml = await File.ReadAllTextAsync(Directory.GetFiles(_dir, "*.eml").Single());
        eml.Should().Contain($"From: {Expected}");
    }
}
