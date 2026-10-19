using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using Saturdaze.Application.Email;

namespace Saturdaze.Infrastructure.Email;

/// <summary>Sends mail through the SMTP server in <c>Saturdaze:Email</c>.</summary>
public sealed class SmtpEmailSender : IEmailSender
{
    private readonly EmailOptions _options;

    public SmtpEmailSender(IOptions<EmailOptions> options) => _options = options.Value;

    public async Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        using var client = new SmtpClient();
        await client.ConnectAsync(_options.SmtpHost!, _options.SmtpPort,
            _options.SmtpStartTls ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto, ct);
        if (!string.IsNullOrEmpty(_options.SmtpUsername))
            await client.AuthenticateAsync(_options.SmtpUsername, _options.SmtpPassword ?? string.Empty, ct);
        await client.SendAsync(EmailMime.From(_options.From, message), ct);
        await client.DisconnectAsync(quit: true, ct);
    }
}
