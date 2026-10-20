using System.Globalization;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Admin.Invitations;

namespace Saturdaze.Application.Email;

/// <summary>The email a platform invitation sends (L2-157): the join link, and the sample weekend when there is one.</summary>
public sealed class InvitationEmails
{
    private readonly string _appOrigin;

    public InvitationEmails(IOptions<EmailOptions> options)
    {
        _appOrigin = (options.Value.AppOrigin ?? string.Empty).TrimEnd('/');
    }

    public EmailMessage Invitation(string to, string token, string? invitedBy, SampleWeekendSummaryDto? sample, string? message)
    {
        var link = _appOrigin + SendInvitationsCommandHandler.JoinLink(token);
        var by = string.IsNullOrWhiteSpace(invitedBy) ? "Saturdaze" : invitedBy;
        var note = string.IsNullOrWhiteSpace(message) ? string.Empty : $"\n\n{message.Trim()}\n";

        if (sample is null)
        {
            return new EmailMessage(
                to,
                "You're invited to Saturdaze",
                $"""
                {by} invited you to Saturdaze, the family weekend planner.

                Create your account here:

                {link}
                {note}
                The link works for 14 days. If you weren't expecting this, ignore this email.
                """);
        }

        var date = sample.WeekendOf.ToString("ddd d MMM", CultureInfo.InvariantCulture);
        return new EmailMessage(
            to,
            $"A weekend planned for {sample.FamilyName} on Saturdaze",
            $"""
            {by} planned a sample weekend for {sample.FamilyName} on Saturdaze, the family weekend planner.

            See Saturday and Sunday {date} and create your account in one step:

            {link}
            {note}
            The link works for 14 days. If you weren't expecting this, ignore this email.
            """);
    }
}
