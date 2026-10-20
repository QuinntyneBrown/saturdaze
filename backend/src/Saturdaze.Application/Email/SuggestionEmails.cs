using Microsoft.Extensions.Options;

namespace Saturdaze.Application.Email;

/// <summary>Mail about a family's event suggestion (L2-149), on the brand (L2-162).</summary>
public sealed class SuggestionEmails
{
    /// <summary>The wording for a rejection with no reason, shared with the card.</summary>
    public const string NoReason = "No reason was given.";

    private readonly string _appOrigin;

    public SuggestionEmails(IOptions<EmailOptions> options)
    {
        _appOrigin = (options.Value.AppOrigin ?? string.Empty).TrimEnd('/');
    }

    public EmailMessage NotAdded(string to, string title, string? reason)
    {
        var content = new EmailContent(
            Subject: $"Your suggestion \"{title}\" was not added",
            Eyebrow: "Your suggestion",
            Title: $"\"{title}\" was not added",
            Paragraphs: new[]
            {
                $"Thanks for suggesting {title}. It was not added to Saturdaze this time.",
                "You can dismiss it from Ideas, Events whenever you like.",
            },
            Cta: new EmailCta("Open Ideas", $"{_appOrigin}/ideas/events"),
            Note: new EmailNote("Why", string.IsNullOrWhiteSpace(reason) ? NoReason : reason.Trim()),
            Sample: null,
            Small: null,
            Footer: $"Sent to {to} because you suggested an event.");
        return EmailLayout.Message(to, content);
    }
}
