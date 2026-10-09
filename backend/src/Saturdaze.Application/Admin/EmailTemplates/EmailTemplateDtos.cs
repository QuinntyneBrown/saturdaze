using System.Text.Json;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>One row of the Email templates screen (L2-125).</summary>
public sealed record EmailTemplateSummaryDto(
    Guid Id,
    string Key,
    string Name,
    string Category,
    string Status,
    bool IsSystem,
    string Subject,
    int Version,
    DateTimeOffset UpdatedAt,
    string UpdatedByEmail)
{
    public static EmailTemplateSummaryDto From(EmailTemplate t) => new(
        t.Id, t.Key, t.Name, t.Category.ToString(), t.Status.ToString(), t.IsSystem, t.Subject, t.Version, t.UpdatedAt, t.UpdatedByEmail);
}

/// <summary>A template with its content, for the editor (L2-127).</summary>
public sealed record EmailTemplateDto(
    Guid Id,
    string Key,
    string Name,
    string Description,
    string Category,
    string Status,
    bool IsSystem,
    string Subject,
    string Preheader,
    string HtmlBody,
    string TextBody,
    IReadOnlyDictionary<string, string> SampleData,
    IReadOnlyList<string> RequiredPlaceholders,
    int Version,
    DateTimeOffset CreatedAt,
    string CreatedByEmail,
    DateTimeOffset UpdatedAt,
    string UpdatedByEmail)
{
    public static EmailTemplateDto From(EmailTemplate t) => new(
        t.Id, t.Key, t.Name, t.Description, t.Category.ToString(), t.Status.ToString(), t.IsSystem,
        t.Subject, t.Preheader, t.HtmlBody, t.TextBody, SampleValues.Read(t.SampleData),
        EmailTemplateCatalog.RequiredPlaceholders(t), t.Version, t.CreatedAt, t.CreatedByEmail, t.UpdatedAt, t.UpdatedByEmail);
}

/// <summary>Reads and writes the <c>SampleData</c> JSON object (placeholder name → sample value).</summary>
public static class SampleValues
{
    public static IReadOnlyDictionary<string, string> Read(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new Dictionary<string, string>();
        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? new Dictionary<string, string>();
        }
        catch (JsonException)
        {
            return new Dictionary<string, string>();
        }
    }

    public static string Write(IReadOnlyDictionary<string, string>? values)
        => JsonSerializer.Serialize(values ?? new Dictionary<string, string>());
}
