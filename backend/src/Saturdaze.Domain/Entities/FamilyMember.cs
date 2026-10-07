namespace Saturdaze.Domain.Entities;

public class FamilyMember
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Age { get; set; }

    /// <summary>The account this member signs in with; null when they don't (L2-124).</summary>
    public Guid? UserId { get; set; }
}
