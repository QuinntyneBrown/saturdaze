using MimeKit;
using Saturdaze.Application.Email;

namespace Saturdaze.Infrastructure.Email;

/// <summary>
/// The MIME message for an <see cref="EmailMessage"/>: plain text alone, or
/// <c>multipart/alternative</c> with the text part first and the branded HTML
/// part second when the message carries one (L2-162 AC4).
/// </summary>
internal static class EmailMime
{
    public static MimeMessage From(string from, EmailMessage message)
    {
        var mime = new MimeMessage();
        mime.From.Add(MailboxAddress.Parse(from));
        mime.To.Add(MailboxAddress.Parse(message.To));
        mime.Subject = message.Subject;
        if (message.HtmlBody is null)
        {
            mime.Body = new TextPart("plain") { Text = message.Body };
        }
        else
        {
            var builder = new BodyBuilder { TextBody = message.Body, HtmlBody = message.HtmlBody };
            mime.Body = builder.ToMessageBody();
        }
        return mime;
    }
}
