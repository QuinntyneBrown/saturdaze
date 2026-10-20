namespace Saturdaze.Application.Email;

/// <summary>The one call to action every message carries (L2-162).</summary>
public sealed record EmailCta(string Label, string Url);

/// <summary>A highlighted note: the administrator's message, a rejection reason.</summary>
public sealed record EmailNote(string Title, string Body);

/// <summary>The sample weekend card of an invitation: the family, the dates and each day's highlight.</summary>
public sealed record EmailSample(string FamilyName, string Dates, string? SaturdayHighlight, string? SundayHighlight);

/// <summary>
/// What one message says, independent of how it is laid out (L2-162). Builders
/// fill it; <see cref="EmailLayout"/> renders the HTML part and its plain-text
/// twin from it, so the two never drift. Every value may have come from a
/// person and is encoded by the layout, never by the builder. <see cref="Subject"/>
/// is also the HTML document's title.
/// </summary>
public sealed record EmailContent(
    string Subject,
    string Eyebrow,
    string Title,
    IReadOnlyList<string> Paragraphs,
    EmailCta Cta,
    EmailNote? Note,
    EmailSample? Sample,
    string? Small,
    string Footer);
