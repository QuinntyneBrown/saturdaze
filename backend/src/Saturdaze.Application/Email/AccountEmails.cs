using Microsoft.Extensions.Options;

namespace Saturdaze.Application.Email;

/// <summary>The account mail the auth handlers send (L2-142).</summary>
public sealed class AccountEmails
{
    private readonly string _appOrigin;

    public AccountEmails(IOptions<EmailOptions> options)
    {
        _appOrigin = (options.Value.AppOrigin ?? string.Empty).TrimEnd('/');
    }

    public EmailMessage Verification(string to, string token) => new(
        to,
        "Confirm your email for Saturdaze",
        $"""
        Confirm this is your email so we can send your weekend plans here.

        {_appOrigin}/verify-email?token={Uri.EscapeDataString(token)}

        The link works for 24 hours. If you didn't create a Saturdaze account, ignore this email.
        """);

    public EmailMessage PasswordReset(string to, string token) => new(
        to,
        "Reset your Saturdaze password",
        $"""
        Someone asked to reset the password for this email.

        {_appOrigin}/reset-password?token={Uri.EscapeDataString(token)}

        The link works for 60 minutes. If it wasn't you, ignore this email and your password stays the same.
        """);
}
