using System.Collections.Concurrent;
using Saturdaze.Application.Email;

namespace Saturdaze.Api.Tests.Support;

/// <summary>
/// Stands in for SMTP: keeps every message the outbox dispatcher delivers.
/// Delivery happens after the response (L2-142), so tests wait for mail.
/// </summary>
public sealed class CapturingEmailSender : IEmailSender
{
    private readonly ConcurrentQueue<EmailMessage> _sent = new();

    public IReadOnlyCollection<EmailMessage> Sent => _sent.ToArray();

    /// <summary>When set, every send throws, as an unreachable mail server would.</summary>
    public bool Fail { get; set; }

    public Task SendAsync(EmailMessage message, CancellationToken ct)
    {
        if (Fail) throw new InvalidOperationException("SMTP server unreachable");
        _sent.Enqueue(message);
        return Task.CompletedTask;
    }

    public IReadOnlyList<EmailMessage> To(string address) =>
        _sent.Where(m => string.Equals(m.To, address, StringComparison.OrdinalIgnoreCase)).ToList();

    /// <summary>Waits until <paramref name="count"/> messages have reached <paramref name="address"/>.</summary>
    public async Task<IReadOnlyList<EmailMessage>> WaitForAsync(string address, int count = 1, int timeoutMs = 5000)
    {
        var deadline = DateTime.UtcNow.AddMilliseconds(timeoutMs);
        while (DateTime.UtcNow < deadline)
        {
            var mail = To(address);
            if (mail.Count >= count) return mail;
            await Task.Delay(25);
        }
        return To(address);
    }

    /// <summary>The token from the first <c>?token=</c> link in a message body.</summary>
    public static string LinkToken(EmailMessage message, string path)
    {
        var marker = path + "?token=";
        var start = message.Body.IndexOf(marker, StringComparison.Ordinal);
        if (start < 0) throw new InvalidOperationException($"No {path} link in: {message.Body}");
        start += marker.Length;
        var end = message.Body.IndexOfAny(new[] { '\r', '\n', ' ' }, start);
        return Uri.UnescapeDataString(end < 0 ? message.Body[start..] : message.Body[start..end]);
    }
}
