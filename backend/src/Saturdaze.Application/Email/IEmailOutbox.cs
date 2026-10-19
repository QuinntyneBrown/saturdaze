namespace Saturdaze.Application.Email;

/// <summary>
/// Accepts mail for delivery after the request is answered (L2-142). Enqueueing
/// never blocks or throws on delivery problems, so a registered and an unknown
/// address answer in the same time (L2-004 AC2).
/// </summary>
public interface IEmailOutbox
{
    void Enqueue(EmailMessage message);
}
