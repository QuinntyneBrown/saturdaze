using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Admin.Invitations;

/// <summary>Derived state of a platform invitation (L2-158).</summary>
public enum PlatformInvitationStatus
{
    Pending = 0,
    Accepted = 1,
    Expired = 2,
    Revoked = 3,
}

public static class PlatformInvitationStatusRules
{
    public static PlatformInvitationStatus Of(PlatformInvitation invitation, DateTimeOffset now)
    {
        if (invitation.AcceptedAtUtc is not null) return PlatformInvitationStatus.Accepted;
        if (invitation.RevokedAtUtc is not null) return PlatformInvitationStatus.Revoked;
        if (invitation.ExpiresAtUtc <= now) return PlatformInvitationStatus.Expired;
        return PlatformInvitationStatus.Pending;
    }

    /// <summary>An invitation whose link still works.</summary>
    public static bool IsPending(PlatformInvitation invitation, DateTimeOffset now)
        => Of(invitation, now) == PlatformInvitationStatus.Pending;
}

/// <summary>The sample weekend an invitation carries, as the list and the send response show it.</summary>
public sealed record SampleWeekendSummaryDto(Guid ProspectId, string FamilyName, DateOnly WeekendOf);

/// <summary>
/// One platform invitation as Saturdaze Admin sees it. <see cref="Url"/> is the
/// join link, present only in the response that created the invitation.
/// </summary>
public sealed record PlatformInvitationDto(
    Guid Id,
    string Email,
    PlatformInvitationStatus Status,
    SampleWeekendSummaryDto? SampleWeekend,
    string? InvitedByEmail,
    string? Message,
    DateTimeOffset CreatedAtUtc,
    DateTimeOffset ExpiresAtUtc,
    DateTimeOffset? AcceptedAtUtc,
    string? Url = null);

public sealed record SendInvitationsResultDto(IReadOnlyList<PlatformInvitationDto> Invitations);
