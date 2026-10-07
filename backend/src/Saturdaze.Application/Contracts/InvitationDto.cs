namespace Saturdaze.Application.Contracts;

/// <summary>What the accept-invite page shows before the invitee chooses a password (L2-127).</summary>
public sealed record InvitationDto(string? FamilyName, string Email, string? InvitedByEmail);
