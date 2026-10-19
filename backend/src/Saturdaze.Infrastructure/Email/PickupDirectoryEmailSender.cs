using Microsoft.Extensions.Options;
using Saturdaze.Application.Email;

namespace Saturdaze.Infrastructure.Email;

/// <summary>
/// Writes each message as an <c>.eml</c> file instead of sending it. Used when
/// no SMTP host is configured, so Development mail can be opened locally.
/// </summary>
public sealed class PickupDirectoryEmailSender : IEmailSender
{
    private readonly EmailOptions _options;

    public PickupDirectoryEmailSender(IOptions<EmailOptions> options) => _options = options.Value;

    public async Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        Directory.CreateDirectory(_options.PickupDirectory);
        var path = Path.Combine(_options.PickupDirectory, $"{DateTime.UtcNow:yyyyMMddTHHmmssfff}-{Guid.NewGuid():N}.eml");
        await using var file = File.Create(path);
        await EmailMime.From(_options.From, message).WriteToAsync(file, ct);
    }
}
