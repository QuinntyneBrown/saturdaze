using Microsoft.Extensions.Options;

namespace Saturdaze.Application.Email;

/// <summary>The email an owner's family invite sends to the invitee (L2-183), on the brand (L2-162).</summary>
public sealed class FamilyInviteEmails
{
    private readonly string _appOrigin;

    public FamilyInviteEmails(IOptions<EmailOptions> options)
    {
        _appOrigin = (options.Value.AppOrigin ?? string.Empty).TrimEnd('/');
    }

    public EmailMessage Invite(string to, string token, string? familyName, string memberName, string invitedBy)
    {
        var family = string.IsNullOrWhiteSpace(familyName) ? "the family" : familyName;
        var content = new EmailContent(
            Subject: $"{invitedBy} invited you to Saturdaze",
            Eyebrow: "A family invitation",
            Title: $"Join {family} on Saturdaze",
            Paragraphs: Array.Empty<string>(),
            Cta: new EmailCta($"Join {family}", $"{_appOrigin}/accept-invite?token={Uri.EscapeDataString(token)}"),
            Note: null,
            Sample: null,
            Small: null,
            Footer: $"Sent to {to}.");
        return EmailLayout.Message(to, content);
    }
}
