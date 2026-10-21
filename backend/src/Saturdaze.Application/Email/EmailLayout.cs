using System.Net;
using System.Text;

namespace Saturdaze.Application.Email;

/// <summary>
/// The branded layout every message is rendered into (L2-162), mirroring
/// <c>docs/mocks/emails/_layout.html</c>: a 600 px single column of tables
/// with inline styles only, no stylesheet, script, web font or image. Mail
/// clients load no design system, so the light theme's token values are
/// inlined here (<c>frontend/projects/components/src/lib/tokens/</c>):
/// </summary>
public static class EmailLayout
{
    /// <summary>colorNeutralBackground2 — the warm page.</summary>
    public const string Page = "#faf7f2";
    /// <summary>colorNeutralBackground1 — the card.</summary>
    public const string Card = "#ffffff";
    /// <summary>colorNeutralForeground1 — ink.</summary>
    public const string Ink = "#1f2937";
    /// <summary>colorNeutralForeground2 — soft ink.</summary>
    public const string SoftInk = "#5b6270";
    /// <summary>colorBrandBackground — the button fill.</summary>
    public const string Brand = "#bf5130";
    /// <summary>colorNeutralForegroundOnBrand — the button text.</summary>
    public const string OnBrand = "#ffffff";
    /// <summary>colorBrandForeground1 — the brand mark.</summary>
    public const string Mark = "#e07856";
    /// <summary>colorBrandBackground2 — the note.</summary>
    public const string NoteFill = "#fbe7de";
    /// <summary>colorNeutralStroke1.</summary>
    public const string Stroke = "rgba(31,41,55,0.16)";
    /// <summary>fontFamilyBase, without the web font a mail client cannot load.</summary>
    public const string Font = "font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;";

    public const string Tagline = "Saturdaze · Family weekends, planned.";

    /// <summary>The message: the subject, the plain-text twin and the HTML part.</summary>
    public static EmailMessage Message(string to, EmailContent content)
        => new(to, content.Subject, Text(content), Render(content));

    /// <summary>The HTML part. Every value is encoded; the markup is fixed.</summary>
    public static string Render(EmailContent c)
    {
        var sb = new StringBuilder(4096);
        sb.Append("<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n");
        sb.Append("<title>").Append(E(c.Subject)).Append("</title>\n</head>\n");
        sb.Append($"<body style=\"margin:0;padding:0;background:{Page};\">\n");
        sb.Append($"<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"background:{Page};\">\n");
        sb.Append("  <tr><td align=\"center\" style=\"padding:32px 16px;\">\n");
        sb.Append("    <table role=\"presentation\" width=\"600\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"width:600px;max-width:100%;\">\n");
        // Header: the brand mark as a coloured cell beside the wordmark.
        sb.Append($"      <tr><td style=\"padding:0 8px 20px;{Font}\">\n");
        sb.Append("        <table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tr>\n");
        sb.Append($"          <td style=\"width:28px;height:28px;border-radius:9px;background:{Mark};\"></td>\n");
        sb.Append($"          <td style=\"padding-left:10px;font-size:17px;font-weight:700;color:{Ink};\">Saturdaze</td>\n");
        sb.Append("        </tr></table>\n      </td></tr>\n");
        // Card.
        sb.Append($"      <tr><td style=\"background:{Card};border:1px solid {Stroke};border-radius:16px;padding:32px;{Font}color:{Ink};\">\n");
        sb.Append($"        <p style=\"margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:{Brand};\">").Append(E(c.Eyebrow)).Append("</p>\n");
        sb.Append($"        <h1 style=\"margin:0 0 12px;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;color:{Ink};\">").Append(E(c.Title)).Append("</h1>\n");
        var paragraphs = c.Paragraphs.Count;
        for (var i = 0; i < paragraphs; i++)
        {
            sb.Append($"        <p style=\"margin:0 0 16px;font-size:16px;line-height:1.5;color:{Ink};\">").Append(E(c.Paragraphs[i])).Append("</p>\n");
            // The sample card and the note sit after the first paragraph, before the ask.
            if (i == 0)
            {
                if (c.Sample is { } s) AppendSample(sb, s);
                if (c.Note is { } n) AppendNote(sb, n);
            }
        }
        if (paragraphs == 0)
        {
            if (c.Sample is { } s) AppendSample(sb, s);
            if (c.Note is { } n) AppendNote(sb, n);
        }
        sb.Append("        <table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"margin:8px 0 24px;\"><tr>");
        sb.Append($"<td style=\"border-radius:999px;background:{Brand};\"><a href=\"").Append(E(c.Cta.Url)).Append("\" style=\"display:inline-block;padding:14px 24px;border-radius:999px;background:")
          .Append(Brand).Append(";color:").Append(OnBrand).Append(";font-size:16px;font-weight:600;text-decoration:none;\">").Append(E(c.Cta.Label)).Append("</a></td></tr></table>\n");
        if (!string.IsNullOrWhiteSpace(c.Small))
            sb.Append($"        <p style=\"margin:0;font-size:13px;line-height:1.5;color:{SoftInk};\">").Append(E(c.Small)).Append("</p>\n");
        sb.Append("      </td></tr>\n");
        // Footer.
        sb.Append($"      <tr><td style=\"padding:20px 8px 0;{Font}font-size:12px;line-height:1.5;color:{SoftInk};\">\n");
        sb.Append("        <p style=\"margin:0 0 4px;\">").Append(E(Tagline)).Append("</p>\n");
        sb.Append("        <p style=\"margin:0;\">").Append(E(c.Footer)).Append("</p>\n");
        sb.Append("      </td></tr>\n    </table>\n  </td></tr>\n</table>\n</body>\n</html>\n");
        return sb.ToString();
    }

    /// <summary>The plain-text twin: the same words and links, in the same order.</summary>
    public static string Text(EmailContent c)
    {
        var sb = new StringBuilder(1024);
        sb.Append(c.Title).Append("\n\n");
        var paragraphs = c.Paragraphs.Count;
        for (var i = 0; i < paragraphs; i++)
        {
            sb.Append(c.Paragraphs[i]).Append("\n\n");
            if (i == 0) AppendExtrasText(sb, c);
        }
        if (paragraphs == 0) AppendExtrasText(sb, c);
        sb.Append(c.Cta.Label).Append(":\n").Append(c.Cta.Url).Append("\n\n");
        if (!string.IsNullOrWhiteSpace(c.Small)) sb.Append(c.Small).Append("\n\n");
        sb.Append(Tagline).Append('\n').Append(c.Footer).Append('\n');
        return sb.ToString();
    }

    private static void AppendExtrasText(StringBuilder sb, EmailContent c)
    {
        if (c.Sample is { } s)
        {
            sb.Append("Sample weekend: ").Append(s.FamilyName).Append(" · ").Append(s.Dates).Append('\n');
            if (s.SaturdayHighlight is not null) sb.Append("Saturday: ").Append(s.SaturdayHighlight).Append('\n');
            if (s.SundayHighlight is not null) sb.Append("Sunday: ").Append(s.SundayHighlight).Append('\n');
            sb.Append('\n');
        }
        if (c.Note is { } n) sb.Append(n.Title).Append('\n').Append(n.Body).Append("\n\n");
    }

    private static void AppendSample(StringBuilder sb, EmailSample s)
    {
        sb.Append("        <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"margin:0 0 20px;\"><tr>");
        sb.Append($"<td style=\"border:1px solid {Stroke};border-radius:16px;padding:16px 20px;\">\n");
        sb.Append($"          <p style=\"margin:0 0 2px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:{SoftInk};\">Sample weekend</p>\n");
        sb.Append($"          <p style=\"margin:0 0 10px;font-size:18px;font-weight:700;color:{Ink};\">").Append(E(s.FamilyName)).Append(" · ").Append(E(s.Dates)).Append("</p>\n");
        sb.Append("          <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\">\n");
        AppendHighlight(sb, "Saturday", s.SaturdayHighlight);
        AppendHighlight(sb, "Sunday", s.SundayHighlight);
        sb.Append("          </table>\n        </td></tr></table>\n");
    }

    private static void AppendHighlight(StringBuilder sb, string day, string? title)
    {
        if (title is null) return;
        sb.Append($"            <tr><td style=\"padding:6px 0;border-top:1px solid {Stroke};font-size:15px;color:{Ink};\"><span style=\"font-weight:600;\">")
          .Append(day).Append("</span> &nbsp;").Append(E(title)).Append("</td></tr>\n");
    }

    private static void AppendNote(StringBuilder sb, EmailNote n)
    {
        sb.Append("        <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"margin:0 0 20px;\"><tr>");
        sb.Append($"<td style=\"border-radius:12px;background:{NoteFill};padding:12px 16px;\">");
        sb.Append($"<p style=\"margin:0 0 2px;font-size:15px;font-weight:600;color:{Ink};\">").Append(E(n.Title)).Append("</p>");
        sb.Append($"<p style=\"margin:0;font-size:14px;line-height:1.5;color:{SoftInk};\">").Append(E(n.Body)).Append("</p></td></tr></table>\n");
    }

    private static string E(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);
}
