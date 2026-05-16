using Saturdaze.Domain.Enums;

namespace Saturdaze.Domain.Entities;

public class Preference
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public PreferenceKind Kind { get; set; }
    public string Value { get; set; } = string.Empty;
}
