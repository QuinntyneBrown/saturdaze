namespace Saturdaze.Application.Email;

/// <summary>Delivers one message. Called off the request path by the outbox dispatcher.</summary>
public interface IEmailSender
{
    Task SendAsync(EmailMessage message, CancellationToken ct);
}
