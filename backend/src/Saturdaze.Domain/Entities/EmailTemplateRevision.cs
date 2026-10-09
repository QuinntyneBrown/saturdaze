using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

/// <summary>
/// An immutable snapshot of an <see cref="EmailTemplate"/> written on every create, save and
/// status change (L2-136). Deleted with its template.
/// </summary>
public class EmailTemplateRevision
{
    public Guid Id { get; set; }
    public Guid TemplateId { get; set; }
    public int Version { get; set; }
    public EmailTemplateRevisionAction Action { get; set; }
    public EmailTemplateStatus Status { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Preheader { get; set; } = string.Empty;
    public string HtmlBody { get; set; } = string.Empty;
    public string TextBody { get; set; } = string.Empty;
    public string SampleData { get; set; } = "{}";
    public DateTimeOffset OccurredAt { get; set; }
    /// <summary>Null when the seeder wrote the revision.</summary>
    public Guid? AdminUserId { get; set; }
    public string AdminEmail { get; set; } = string.Empty;
}
