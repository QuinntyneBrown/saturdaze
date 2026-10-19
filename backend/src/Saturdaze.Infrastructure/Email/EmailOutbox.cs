using System.Threading.Channels;
using Saturdaze.Application.Email;

namespace Saturdaze.Infrastructure.Email;

/// <summary>In-memory queue between the request and <see cref="EmailDispatchService"/> (L2-142).</summary>
public sealed class EmailOutbox : IEmailOutbox
{
    private readonly Channel<EmailMessage> _channel = Channel.CreateUnbounded<EmailMessage>(
        new UnboundedChannelOptions { SingleReader = true });

    public ChannelReader<EmailMessage> Reader => _channel.Reader;

    public void Enqueue(EmailMessage message) => _channel.Writer.TryWrite(message);
}
