namespace Saturdaze.Domain.Entities;

/// <summary>
/// An administrator's single-use invitation for one email address to join
/// Saturdaze (L2-157). Only the hash of the token is stored. It may carry a
/// prospect whose sample weekend the invitee sees before joining (L2-161).
/// Status is derived from the timestamps, never stored (ADR-019).
/// </summary>
public class PlatformInvitation
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string NormalizedEmail { get; set; } = string.Empty;
    public string TokenHash { get; set; } = string.Empty;

    /// <summary>The sample family and weekend attached to the invite, when any.</summary>
    public Guid? ProspectId { get; set; }

    /// <summary>A line from the administrator, included in the email.</summary>
    public string? Message { get; set; }

    public Guid InvitedByUserId { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public DateTimeOffset? AcceptedAtUtc { get; set; }
    public Guid? AcceptedUserId { get; set; }
    public DateTimeOffset? RevokedAtUtc { get; set; }
}
