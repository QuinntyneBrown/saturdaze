using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Saturdaze.Application.Email;

namespace Saturdaze.Infrastructure.Email;

/// <summary>
/// Delivers queued mail off the request path. A failed send is logged by
/// subject only, never the recipient or the body, which carries the token
/// (L2-142 AC5, L1-012).
/// </summary>
public sealed class EmailDispatchService : BackgroundService
{
    private readonly EmailOutbox _outbox;
    private readonly IEmailSender _sender;
    private readonly ILogger<EmailDispatchService> _logger;

    public EmailDispatchService(EmailOutbox outbox, IEmailSender sender, ILogger<EmailDispatchService> logger)
    {
        _outbox = outbox;
        _sender = sender;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var message in _outbox.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await _sender.SendAsync(message, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                _logger.LogError("Email delivery failed for '{Subject}': {Error}", message.Subject, ex.GetType().Name);
            }
        }
    }
}
