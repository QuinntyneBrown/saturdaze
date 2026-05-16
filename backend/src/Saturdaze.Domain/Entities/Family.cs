namespace Saturdaze.Domain.Entities;

public class Family
{
    public Guid Id { get; set; }
    public string HomeLocation { get; set; } = string.Empty;
    public bool BudgetEnabled { get; set; }

    public List<FamilyMember> Members { get; set; } = new();
    public List<Commitment> Commitments { get; set; } = new();
    public List<Preference> Preferences { get; set; } = new();
}
