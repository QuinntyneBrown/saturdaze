using System.Text.RegularExpressions;
using Saturdaze.Application.Exceptions;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>
/// The checks every template's key and content pass (L2-126, L2-127, L2-128). Placeholders are
/// <c>{{name}}</c> with optional spaces inside the braces; a name is letters, digits and
/// underscores in dot-separated parts, each starting with a letter.
/// </summary>
public static partial class EmailTemplateRules
{
    /// <summary>Lowercase letters and digits in words joined by dots or hyphens.</summary>
    public const string KeyPattern = "^[a-z0-9]+(?:[.-][a-z0-9]+)*$";

    /// <summary>A placeholder name: <c>recipientName</c>, <c>family.first_child</c>.</summary>
    public const string PlaceholderNamePattern = "^[A-Za-z][A-Za-z0-9_]*(?:\\.[A-Za-z][A-Za-z0-9_]*)*$";

    [GeneratedRegex(@"\{\{(.*?)\}\}", RegexOptions.Singleline)]
    private static partial Regex Braces();

    [GeneratedRegex(PlaceholderNamePattern)]
    private static partial Regex PlaceholderName();

    [GeneratedRegex(@"<[^>]*>", RegexOptions.Singleline)]
    private static partial Regex Tag();

    [GeneratedRegex(@"^<\s*/?\s*(script|iframe|frame|frameset|object|embed|applet|form|base)\b", RegexOptions.IgnoreCase)]
    private static partial Regex ForbiddenElement();

    [GeneratedRegex(@"[\s/""']on[a-z]+\s*=", RegexOptions.IgnoreCase)]
    private static partial Regex EventAttribute();

    [GeneratedRegex(@"[\s\u0000-\u001f]+")]
    private static partial Regex Whitespace();

    public static bool IsPlaceholderName(string name) => PlaceholderName().IsMatch(name);

    /// <summary>The distinct placeholder names in <paramref name="text"/>, in order of first use; malformed ones are skipped.</summary>
    public static IReadOnlyList<string> Placeholders(string? text)
    {
        var names = new List<string>();
        if (string.IsNullOrEmpty(text)) return names;
        foreach (Match m in Braces().Matches(text))
        {
            var name = m.Groups[1].Value.Trim();
            if (IsPlaceholderName(name) && !names.Contains(name)) names.Add(name);
        }
        return names;
    }

    /// <summary>Refuses a malformed placeholder in any field with <c>invalid_placeholder</c> (L2-127 AC4).</summary>
    public static void CheckPlaceholders(params string?[] texts)
    {
        foreach (var text in texts)
        {
            if (string.IsNullOrEmpty(text)) continue;
            var rest = text;
            foreach (Match m in Braces().Matches(text))
            {
                var inner = m.Groups[1].Value;
                if (inner.StartsWith('{') || !IsPlaceholderName(inner.Trim()))
                    throw InvalidPlaceholder(m.Value);
            }
            // Braces left over once every {{…}} is removed are an unclosed or stray placeholder.
            rest = Braces().Replace(rest, string.Empty);
            if (rest.Contains("{{") || rest.Contains("}}"))
                throw InvalidPlaceholder(rest.Contains("{{") ? "{{" : "}}");
        }
    }

    /// <summary>
    /// Refuses HTML that could run script or post data (L2-127 AC3): forbidden elements, an
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

    /// <summary>Refuses a body that dropped a required placeholder with <c>missing_placeholder</c> (L2-127 AC5).</summary>
    public static void CheckRequired(IReadOnlyList<string> required, string? htmlBody, string? textBody)
    {
        if (required.Count == 0) return;
        var html = Placeholders(htmlBody);
        var text = Placeholders(textBody);
        foreach (var name in required)
        {
            if (!html.Contains(name) || !text.Contains(name))
                throw new BadRequestException("missing_placeholder",
                    $"The HTML body and the plain-text body both need {{{{{name}}}}}.");
        }
    }

    private static BadRequestException InvalidPlaceholder(string found) => new("invalid_placeholder",
        $"\"{found}\" is not a placeholder. Write {{{{name}}}}: letters, digits and underscores, parts joined by dots.");
}
