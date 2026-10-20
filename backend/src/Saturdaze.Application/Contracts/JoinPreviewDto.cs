namespace Saturdaze.Application.Contracts;

/// <summary>
/// What a join link is for, before the invitee chooses a password (L2-161):
/// the invited address, who invited them, and the sample weekend as a share
/// viewer would see it, or <c>null</c> when the invitation carries none.
/// </summary>
public sealed record JoinPreviewDto(
    string Email,
    string? InvitedByEmail,
    string? FamilyName,
    string? Message,
    SharedWeekendDto? Sample);
