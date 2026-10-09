using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

/// <summary>
/// Named, categorized email content an administrator manages from Saturdaze Admin (L2-130):
/// a subject, preheader, HTML body and plain-text body written with <c>{{placeholders}}</c>.
/// A later sender finds an active template by its <see cref="Key"/>. <see cref="Version"/>
/// starts at 1, increases on every change and is the optimistic concurrency token.
/// </summary>
public class EmailTemplate
{
    public Guid Id { get; set; }
    /// <summary>Unique and immutable: lowercase words joined by dots or hyphens (<c>account.password-reset</c>).</summary>
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public EmailTemplateCategory Category { get; set; }
    public EmailTemplateStatus Status { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Preheader { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public string TextBody { get; set; } = string.Empty;
    /// <summary>JSON object of placeholder name to the sample value the preview uses.</summary>
    public string SampleData { get; set; } = "{}";
    /// <summary>A template the platform depends on: editable, never deleted, archived or left without its required placeholder.</summary>
    public bool IsSystem { get; set; }
    public int Version { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public string CreatedByEmail { get; set; } = string.Empty;
    public DateTimeOffset UpdatedAt { get; set; }
    public string UpdatedByEmail { get; set; } = string.Empty;
    /// <summary>The administrator who made the last change; null when the seeder wrote it.</summary>
    public Guid? UpdatedBy { get; set; }
}
