using System.Text.RegularExpressions;

namespace Saturdaze.Application.Admin.EmailTemplates;

/// <summary>The checks every template's key and content pass (L2-126, L2-127).</summary>
public static partial class EmailTemplateRules
{
    /// <summary>Lowercase letters and digits in words joined by dots or hyphens.</summary>
    public const string KeyPattern = "^[a-z0-9]+(?:[.-][a-z0-9]+)*$";
}
