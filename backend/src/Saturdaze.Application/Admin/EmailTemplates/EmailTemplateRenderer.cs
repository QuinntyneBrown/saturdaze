using System.Net;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Common;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>Where the preview's built-in <c>appUrl</c> points (<c>Saturdaze:Email:AppUrl</c>, else the share link origin).</summary>
public sealed class EmailPreviewOptions
{
    public string AppUrl { get; set; } = "https://saturdaze.app";
}

/// <summary>One placeholder of a rendered preview: its value and where it came from (L2-128).</summary>
public sealed record EmailPlaceholderDto(string Name, string Value, string Source);

/// <summary>A template rendered with sample data (L2-128).</summary>
public sealed record EmailPreviewDto(
    string Subject,
    string Preheader,
    string Html,
    string Text,
    IReadOnlyList<EmailPlaceholderDto> Placeholders);

/// <summary>
/// Renders template content (L2-128): each <c>{{name}}</c> takes its sample value, else its
/// built-in value, else an empty string. Values substituted into the HTML body are HTML-encoded;
/// subject, preheader and text body take them as written. No database access, so a sender can
/// reuse it with real values in place of the samples.
/// </summary>
public sealed partial class EmailTemplateRenderer
{
    public const string Sample = "sample";
    public const string BuiltIn = "builtin";
    public const string Missing = "missing";

    [GeneratedRegex(@"\{\{\s*([A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z][A-Za-z0-9_]*)*)\s*\}\}")]
    private static partial Regex Placeholder();

    private readonly EmailPreviewOptions _options;
    private readonly IDateTimeProvider _clock;

    public EmailTemplateRenderer(IOptions<EmailPreviewOptions> options, IDateTimeProvider clock)
    {
        _options = options.Value;
        _clock = clock;
    }

    /// <summary>The built-in sample values every template may use.</summary>
    public IReadOnlyDictionary<string, string> BuiltIns()
    {
        var appUrl = _options.AppUrl.TrimEnd('/');
        return new Dictionary<string, string>
        {
            ["appName"] = "Saturdaze",
            ["appUrl"] = appUrl,
            ["recipientName"] = "Alex",
            ["recipientEmail"] = "alex@example.com",
            ["unsubscribeUrl"] = $"{appUrl}/unsubscribe?token=sample",
            ["currentYear"] = _clock.UtcNow.ToUniversalTime().Year.ToString(System.Globalization.CultureInfo.InvariantCulture),
        };
    }

    public EmailPreviewDto Render(
        string? subject, string? preheader, string? htmlBody, string? textBody, IReadOnlyDictionary<string, string>? sampleData)
    {
        var builtIns = BuiltIns();
        var samples = sampleData ?? new Dictionary<string, string>();
        var used = new List<EmailPlaceholderDto>();

        (string Value, string Source) Resolve(string name)
        {
            if (samples.TryGetValue(name, out var sample) && !string.IsNullOrEmpty(sample)) return (sample, Sample);
            if (builtIns.TryGetValue(name, out var builtIn)) return (builtIn, BuiltIn);
            return (string.Empty, Missing);
        }

        string Fill(string? text, bool html) => Placeholder().Replace(text ?? string.Empty, m =>
        {
            var name = m.Groups[1].Value;
            var (value, source) = Resolve(name);
            if (used.All(p => p.Name != name)) used.Add(new EmailPlaceholderDto(name, value, source));
            return html ? WebUtility.HtmlEncode(value) : value;
        });

        var renderedSubject = Fill(subject, html: false);
        var renderedPreheader = Fill(preheader, html: false);
        var renderedHtml = Fill(htmlBody, html: true);
        var renderedText = Fill(textBody, html: false);
        return new EmailPreviewDto(renderedSubject, renderedPreheader, renderedHtml, renderedText, used);
    }
}
