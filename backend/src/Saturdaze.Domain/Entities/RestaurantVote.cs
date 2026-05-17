namespace Saturdaze.Domain.Entities;

public class RestaurantVote
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public Guid RestaurantId { get; set; }
    public string VoterName { get; set; } = string.Empty;
    public string Vote { get; set; } = "none";
    public DateTimeOffset UpdatedAtUtc { get; set; }
}
