using System.Text.RegularExpressions;
using Saturdaze.Application.Exceptions;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>
/// The checks every template's key and content pass (L2-132, L2-133, L2-134). Content is Liquid
/// (ADR-017), checked through <see cref="EmailTemplateLiquid"/>; this class adds the HTML deny-list
/// and the required variables.
/// </summary>
public static partial class EmailTemplateRules
{
    /// <summary>Lowercase letters and digits in words joined by dots or hyphens.</summary>
    public const string KeyPattern = "^[a-z0-9]+(?:[.-][a-z0-9]+)*$";

    /// <summary>A Liquid identifier, usable as a top-level sample data name: <c>recipientName</c>, <c>first_child</c>.</summary>
    public const string VariableNamePattern = "^[A-Za-z_][A-Za-z0-9_-]*$";

    [GeneratedRegex(VariableNamePattern)]
    private static partial Regex VariableName();

    [GeneratedRegex(@"<[^>]*>", RegexOptions.Singleline)]
    private static partial Regex Tag();

    [GeneratedRegex(@"^<\s*/?\s*(script|iframe|frame|frameset|object|embed|applet|form|base)\b", RegexOptions.IgnoreCase)]
    private static partial Regex ForbiddenElement();

    [GeneratedRegex(@"[\s/""']on[a-z]+\s*=", RegexOptions.IgnoreCase)]
    private static partial Regex EventAttribute();

    [GeneratedRegex(@"[\s\u0000-\u001f]+")]
    private static partial Regex Whitespace();

    public static bool IsVariableName(string name) => VariableName().IsMatch(name);

    /// <summary>
    /// Checks the four fields as a save or preview does: valid Liquid under ADR-017's profile, then
    /// the HTML deny-list. Returns what each body reads, for <see cref="CheckRequired"/>.
    /// </summary>
    public static (LiquidAnalysis Html, LiquidAnalysis Text) CheckContent(
        string? subject, string? preheader, string? htmlBody, string? textBody)
    {
        EmailTemplateLiquid.Check(EmailTemplateLiquid.Subject, subject);
        EmailTemplateLiquid.Check(EmailTemplateLiquid.Preheader, preheader);
        var html = EmailTemplateLiquid.Check(EmailTemplateLiquid.HtmlBody, htmlBody, html: true).Analysis;
        var text = EmailTemplateLiquid.Check(EmailTemplateLiquid.TextBody, textBody).Analysis;
        CheckHtml(htmlBody);
        return (html, text);
    }

    /// <summary>
    /// Refuses HTML that could run script or post data (L2-133 AC3): forbidden elements, an
    /// <c>on…=</c> event attribute, or a <c>javascript:</c>, <c>vbscript:</c> or <c>data:text/html</c>
    /// address inside a tag. Text between tags is not inspected.
    /// </summary>
    public static void CheckHtml(string? html)
    {
        if (string.IsNullOrEmpty(html)) return;
        foreach (Match tag in Tag().Matches(html))
        {
            var value = tag.Value;
            if (value.StartsWith("<!--", StringComparison.Ordinal)) continue;
            var compact = Whitespace().Replace(System.Net.WebUtility.HtmlDecode(value), string.Empty).ToLowerInvariant();
            if (ForbiddenElement().IsMatch(value)
                || EventAttribute().IsMatch(value)
                || compact.Contains("javascript:")
                || compact.Contains("vbscript:")
                || compact.Contains("data:text/html"))
            {
                throw new BadRequestException("unsafe_html",
                    "Scripts, frames, forms and on… event attributes aren't allowed in an email.");
            }
        }
    }

    /// <summary>Refuses a body that no longer reads a required variable with <c>missing_placeholder</c> (L2-133 AC5).</summary>
    public static void CheckRequired(IReadOnlyList<string> required, LiquidAnalysis html, LiquidAnalysis text)
    {
        foreach (var name in required)
        {
            if (!html.Variables.Contains(name) || !text.Variables.Contains(name))
                throw new BadRequestException("missing_placeholder",
                    $"The HTML body and the plain-text body both need to use {name}, for example {{{{ {name} }}}}.");
        }
    }
}
