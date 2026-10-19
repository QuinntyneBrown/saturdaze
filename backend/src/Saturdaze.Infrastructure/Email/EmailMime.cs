using MimeKit;
using Saturdaze.Application.Email;

namespace Saturdaze.Infrastructure.Email;

internal static class EmailMime
{
    public static MimeMessage From(string from, EmailMessage message)
    {
        var mime = new MimeMessage();
        mime.From.Add(MailboxAddress.Parse(from));
        mime.To.Add(MailboxAddress.Parse(message.To));
        mime.Subject = message.Subject;
        mime.Body = new TextPart("plain") { Text = message.Body };
        return mime;
    }
}
