using Microsoft.Extensions.Options;

namespace Saturdaze.Application.Email;

/// <summary>The account mail the auth handlers send (L2-142), on the brand (L2-162).</summary>
public sealed class AccountEmails
{
    private readonly string _appOrigin;

    public AccountEmails(IOptions<EmailOptions> options)
    {
        _appOrigin = (options.Value.AppOrigin ?? string.Empty).TrimEnd('/');
    }

    public EmailMessage Verification(string to, string token)
    {
        var content = new EmailContent(
            Subject: "Confirm your email for Saturdaze",
            Eyebrow: "Welcome",
            Title: "Confirm your email",
            Paragraphs: new[] { "Confirm this is your email so we can send your weekend plans here." },
            Cta: new EmailCta("Confirm my email", $"{_appOrigin}/verify-email?token={Uri.EscapeDataString(token)}"),
            Note: null,
            Sample: null,
            Small: "The link works for 24 hours. If you didn't create a Saturdaze account, ignore this email.",
            Footer: $"Sent to {to} because an account was created with this address.");
        return EmailLayout.Message(to, content);
    }

    public EmailMessage PasswordReset(string to, string token)
    {
        var content = new EmailContent(
            Subject: "Reset your Saturdaze password",
            Eyebrow: "Your account",
            Title: "Reset your password",
            Paragraphs: new[] { "Someone asked to reset the password for this email." },
            Cta: new EmailCta("Choose a new password", $"{_appOrigin}/reset-password?token={Uri.EscapeDataString(token)}"),
            Note: null,
            Sample: null,
            Small: "The link works for 60 minutes. If it wasn't you, ignore this email and your password stays the same.",
            Footer: $"Sent to {to} because a password reset was requested.");
        return EmailLayout.Message(to, content);
    }
}
