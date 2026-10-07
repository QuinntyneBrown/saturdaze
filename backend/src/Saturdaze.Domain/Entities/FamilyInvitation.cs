namespace Saturdaze.Domain.Entities;

/// <summary>
/// A single-use invitation for a member to sign in to the family (L2-126).
/// Only the hash of the token is stored; the row goes with its member.
/// </summary>
public class FamilyInvitation
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public Guid FamilyMemberId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string NormalizedEmail { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;
    public Guid InvitedByUserId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? AcceptedAtUtc { get; set; }
}
