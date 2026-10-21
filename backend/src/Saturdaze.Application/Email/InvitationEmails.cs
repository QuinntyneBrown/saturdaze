using System.Globalization;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Admin.Invitations;

namespace Saturdaze.Application.Email;

/// <summary>The sample weekend an invitation email shows (L2-162 AC2).</summary>
public sealed record InvitationSample(string FamilyName, DateOnly WeekendOf, string? SaturdayHighlight, string? SundayHighlight)
{
    /// <summary>"Sat 24 Oct – Sun 25 Oct".</summary>
    public string Dates => $"{Day(WeekendOf)} – {Day(WeekendOf.AddDays(1))}";

    private static string Day(DateOnly d) => d.ToString("ddd d MMM", CultureInfo.InvariantCulture);
}

/// <summary>The email a platform invitation sends (L2-157), on the brand (L2-162).</summary>
public sealed class InvitationEmails
{
    private readonly string _appOrigin;

    public InvitationEmails(IOptions<EmailOptions> options)
    {
        _appOrigin = (options.Value.AppOrigin ?? string.Empty).TrimEnd('/');
    }

    public EmailMessage Invitation(string to, string token, string? invitedBy, InvitationSample? sample, string? message)
    {
        var link = _appOrigin + SendInvitationsCommandHandler.JoinLink(token);
        var by = string.IsNullOrWhiteSpace(invitedBy) ? "Saturdaze" : invitedBy;
        var note = string.IsNullOrWhiteSpace(message) ? null : new EmailNote($"From {by}", message.Trim());
        const string small = "The link works for 14 days. If you weren't expecting this, ignore this email.";
        var footer = $"Sent to {to} because an administrator invited you.";

        EmailContent content;
        if (sample is null)
        {
            content = new EmailContent(
                Subject: "You're invited to Saturdaze",
                Eyebrow: "An invitation",
                Title: "You're invited to Saturdaze",
                Paragraphs: new[]
                {
                    $"{by} invited you to Saturdaze, the family weekend planner. Saturdaze drafts Saturday and Sunday around your family, your commitments and the weather.",
                    "Create your account here:",
                },
                Cta: new EmailCta("Create your account", link),
                Note: note,
                Sample: null,
                Small: small,
                Footer: footer);
        }
        else
        {
            content = new EmailContent(
                Subject: $"A weekend planned for {sample.FamilyName} on Saturdaze",
                Eyebrow: "A weekend planned for you",
                Title: $"A weekend planned for {sample.FamilyName}",
                Paragraphs: new[]
                {
                    $"{by} planned a sample weekend for {sample.FamilyName} on Saturdaze, the family weekend planner.",
                    "See Saturday and Sunday in full and create your account in one step:",
                },
                Cta: new EmailCta("Create your account", link),
                Note: note,
                Sample: new EmailSample(sample.FamilyName, sample.Dates, sample.SaturdayHighlight, sample.SundayHighlight),
                Small: small,
                Footer: footer);
        }
        return EmailLayout.Message(to, content);
    }
}
