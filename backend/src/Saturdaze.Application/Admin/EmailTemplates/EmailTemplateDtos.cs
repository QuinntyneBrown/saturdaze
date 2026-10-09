using System.Text.Json;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>One row of the Email templates screen (L2-131).</summary>
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

/// <summary>A template with its content, for the editor (L2-133).</summary>
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
    JsonElement SampleData,
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

/// <summary>Reads and writes the stored <c>SampleData</c> JSON object (Liquid variable → any JSON value, L2-130).</summary>
public static class SampleValues
{
    public static JsonElement Empty => Of(new Dictionary<string, string>());

    public static JsonElement Of(IReadOnlyDictionary<string, string> values) => JsonSerializer.SerializeToElement(values);

    /// <summary>The stored object; anything that is not a JSON object reads as <c>{}</c>.</summary>
    public static JsonElement Read(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return Empty;
        try
        {
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.ValueKind == JsonValueKind.Object ? doc.RootElement.Clone() : Empty;
        }
        catch (JsonException)
        {
            return Empty;
        }
    }

    public static string Write(JsonElement? value)
        => value is { ValueKind: JsonValueKind.Object } data ? JsonSerializer.Serialize(data) : "{}";
}
