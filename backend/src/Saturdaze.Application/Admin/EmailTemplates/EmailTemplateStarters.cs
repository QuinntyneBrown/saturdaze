using System.Text.Json;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>The content a new template starts with (L2-126).</summary>
public sealed record EmailTemplateContent(
    string Subject,
    string Preheader,
    string HtmlBody,
    string TextBody,
    JsonElement SampleData);

/// <summary>
/// One starter per category (L2-126): a greeting, a message, a call to action and a footer
/// written with built-in placeholders. The marketing starter carries <c>{{unsubscribeUrl}}</c>
/// in both bodies (L2-126 AC2).
/// </summary>
public static class EmailTemplateStarters
{
    public static EmailTemplateContent For(EmailTemplateCategory category) => category switch
    {
        EmailTemplateCategory.Account => Build(
            "A note about your {{appName}} account",
            "Something changed on your account.",
            "Something changed on your {{appName}} account ({{recipientEmail}}).",
            "Open Saturdaze"),
        EmailTemplateCategory.Notification => Build(
            "{{headline}}",
            "Here is what changed in your plans.",
            "{{message}}",
            "See your weekend",
            new Dictionary<string, string> { ["headline"] = "Your weekend plan is ready", ["message"] = "Saturday and Sunday are planned around the weather." }),
        EmailTemplateCategory.Scheduled => Build(
            "Your weekend with {{appName}}",
            "Ideas for the weekend ahead.",
            "Here is what the weekend of {{weekendDates}} looks like.",
            "Plan the weekend",
            new Dictionary<string, string> { ["weekendDates"] = "11 and 12 October" }),
        EmailTemplateCategory.SpecialOccasion => Build(
            "Happy {{occasion}} from {{appName}}",
            "A little something for the day.",
            "Wishing you a happy {{occasion}}. Here are a few ways to celebrate this weekend.",
            "Find a way to celebrate",
            new Dictionary<string, string> { ["occasion"] = "birthday" }),
        EmailTemplateCategory.Marketing => Build(
            "Something new on {{appName}}",
            "What is new this season.",
            "Here is what is new on {{appName}} this season.",
            "Take a look",
            unsubscribe: true),
        _ => throw new ArgumentOutOfRangeException(nameof(category), category, null),
    };

    private static EmailTemplateContent Build(
        string subject,
        string preheader,
        string message,
        string action,
        Dictionary<string, string>? samples = null,
        bool unsubscribe = false)
    {
        var htmlFooter = unsubscribe
            ? "\n      <p style=\"margin:16px 0 0;font-size:12px;color:#7b8794\">You get these because you asked for news from {{appName}}. <a href=\"{{unsubscribeUrl}}\" style=\"color:#7b8794\">Unsubscribe</a>.</p>"
            : string.Empty;
        var html = $$$"""
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffaf5">
  <tr>
    <td style="padding:32px 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#1f2933">
      <p style="margin:0 0 16px">Hi {{recipientName}},</p>
      <p style="margin:0 0 24px">{{{message}}}</p>
      <p style="margin:0 0 24px"><a href="{{appUrl}}" style="display:inline-block;background:#c2410c;color:#ffffff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">{{{action}}}</a></p>
      <p style="margin:0;font-size:12px;color:#7b8794">{{appName}} · {{currentYear}}</p>{{{htmlFooter}}}
    </td>
  </tr>
</table>
""";
        var text = $"Hi {{{{recipientName}}}},\n\n{message}\n\n{action}: {{{{appUrl}}}}\n\n{{{{appName}}}}"
            + (unsubscribe ? "\n\nUnsubscribe: {{unsubscribeUrl}}" : string.Empty);
        return new EmailTemplateContent(subject, preheader, html, text, SampleValues.Of(samples ?? new Dictionary<string, string>()));
    }
}
