namespace Saturdaze.Domain.Entities;

public class FamilyMember
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Age { get; set; }
}
