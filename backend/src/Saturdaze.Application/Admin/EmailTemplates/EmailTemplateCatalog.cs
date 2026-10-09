using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>
/// The fixed knowledge about email templates (L2-130, L2-132, L2-133): which keys are system
/// templates and the placeholder each must keep, the placeholder every marketing template keeps,
/// and the wire names of categories and statuses.
/// </summary>
public static class EmailTemplateCatalog
{
    public const string UnsubscribeUrl = "unsubscribeUrl";

    /// <summary>The link each system template exists to carry.</summary>
    public static readonly IReadOnlyDictionary<string, string> SystemLinks = new Dictionary<string, string>
    {
        ["account.verify-email"] = "verificationLink",
        ["account.password-reset"] = "resetLink",
    };

    /// <summary>Placeholders the HTML and text bodies shall both keep.</summary>
    public static IReadOnlyList<string> RequiredPlaceholders(EmailTemplate template)
        => RequiredPlaceholders(template.Key, template.IsSystem, template.Category);

    public static IReadOnlyList<string> RequiredPlaceholders(string key, bool isSystem, EmailTemplateCategory category)
    {
        var required = new List<string>();
        if (isSystem && SystemLinks.TryGetValue(key, out var link)) required.Add(link);
        if (category == EmailTemplateCategory.Marketing) required.Add(UnsubscribeUrl);
        return required;
    }

    /// <summary>Parses a category by name, ignoring case; numbers are not names.</summary>
    public static bool TryParseCategory(string? value, out EmailTemplateCategory category)
        => TryParseName(value, out category);

    /// <summary>Parses a status by name, ignoring case; numbers are not names.</summary>
    public static bool TryParseStatus(string? value, out EmailTemplateStatus status)
        => TryParseName(value, out status);

    private static bool TryParseName<T>(string? value, out T parsed) where T : struct, Enum
    {
        parsed = default;
        if (string.IsNullOrWhiteSpace(value) || int.TryParse(value, out _)) return false;
        return Enum.TryParse(value.Trim(), true, out parsed) && Enum.IsDefined(parsed);
    }
}
