using System.Globalization;
using System.Text.Encodings.Web;
using System.Text.Json;
using Fluid;
using Microsoft.Extensions.Options;
using Saturdaze.Application.Common;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>Where the preview's built-in <c>appUrl</c> points (<c>Saturdaze:Email:AppUrl</c>, else the share link origin).</summary>
public sealed class EmailPreviewOptions
{
    public string AppUrl { get; set; } = "https://saturdaze.app";
}

/// <summary>One placeholder of a rendered preview: its value and where it came from (L2-134).</summary>
public sealed record EmailPlaceholderDto(string Name, string Value, string Source);

/// <summary>A template rendered with sample data (L2-134).</summary>
public sealed record EmailPreviewDto(
    string Subject,
    string Preheader,
    string Html,
    string Text,
    IReadOnlyList<EmailPlaceholderDto> Placeholders);

/// <summary>
/// Renders template content as Liquid (L2-134, ADR-017). The context holds the built-in samples
/// with the sample data over them; a variable with neither renders empty. The HTML body is
/// rendered with <see cref="HtmlEncoder.Default"/>, so every value written into it is encoded; the
/// subject, preheader and text body take values as written. No database access, so a sender can
/// reuse it with real values in place of the samples.
/// </summary>
public sealed class EmailTemplateRenderer
{
    public const string Sample = "sample";
    public const string BuiltIn = "builtin";
    public const string Missing = "missing";

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
            ["currentYear"] = _clock.UtcNow.ToUniversalTime().Year.ToString(CultureInfo.InvariantCulture),
        };
    }

    public EmailPreviewDto Render(
        string? subject, string? preheader, string? htmlBody, string? textBody, JsonElement? sampleData)
    {
        var builtIns = BuiltIns();
        var samples = sampleData is { ValueKind: JsonValueKind.Object } data
            ? data.EnumerateObject().Where(p => !IsBlank(p.Value)).GroupBy(p => p.Name).ToDictionary(g => g.Key, g => g.Last().Value)
            : new Dictionary<string, JsonElement>();

        var context = new TemplateContext(EmailTemplateLiquid.Options);
        foreach (var (name, value) in builtIns) context.SetValue(name, value);
        foreach (var (name, value) in samples) context.SetValue(name, ToLiquid(value));

        var used = new List<EmailPlaceholderDto>();
        string Fill(string field, string? text, TextEncoder encoder)
        {
            var template = EmailTemplateLiquid.Parse(field, text);
            foreach (var name in EmailTemplateLiquid.Analyse(template).Variables)
            {
                if (used.Any(p => p.Name == name)) continue;
                used.Add(samples.TryGetValue(name, out var sample) ? new(name, Describe(sample), Sample)
                    : builtIns.TryGetValue(name, out var builtIn) ? new(name, builtIn, BuiltIn)
                    : new(name, string.Empty, Missing));
            }
            try
            {
                return template.Render(context, encoder);
            }
            catch (InvalidOperationException)
            {
                // Fluid stops a render that runs past MaxSteps (or MaxRecursion) this way.
                throw EmailTemplateLiquid.TooManySteps(field);
            }
        }

        var renderedSubject = Fill(EmailTemplateLiquid.Subject, subject, NullEncoder.Default);
        var renderedPreheader = Fill(EmailTemplateLiquid.Preheader, preheader, NullEncoder.Default);
        var renderedHtml = Fill(EmailTemplateLiquid.HtmlBody, htmlBody, HtmlEncoder.Default);
        var renderedText = Fill(EmailTemplateLiquid.TextBody, textBody, NullEncoder.Default);
        return new EmailPreviewDto(renderedSubject, renderedPreheader, renderedHtml, renderedText, used);
    }

    /// <summary>A sample of null or empty text falls back to the built-in, as an empty field did before.</summary>
    private static bool IsBlank(JsonElement value)
        => value.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined
           || (value.ValueKind == JsonValueKind.String && value.GetString()!.Length == 0);

    /// <summary>The placeholder list's value: text as written, anything else as JSON.</summary>
    private static string Describe(JsonElement value) => value.ValueKind switch
    {
        JsonValueKind.String => value.GetString()!,
        JsonValueKind.True => "true",
        JsonValueKind.False => "false",
        _ => value.GetRawText(),
    };

    /// <summary>JSON as the dictionaries, lists and primitives Fluid reads members and items from.</summary>
    private static object? ToLiquid(JsonElement value) => value.ValueKind switch
    {
        JsonValueKind.Object => value.EnumerateObject()
            .GroupBy(p => p.Name).ToDictionary(g => g.Key, g => ToLiquid(g.Last().Value)),
        JsonValueKind.Array => value.EnumerateArray().Select(ToLiquid).ToList(),
        JsonValueKind.String => value.GetString(),
        JsonValueKind.Number => value.TryGetDecimal(out var number) ? number : value.GetDouble(),
        JsonValueKind.True => true,
        JsonValueKind.False => false,
        _ => null,
    };
}
