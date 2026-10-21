using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Admin.Prospects;

/// <summary>Derived state of a prospect (L2-159): invited once any invitation names it, claimed once accepted.</summary>
public enum ProspectStatus
{
    Draft = 0,
    Invited = 1,
    Claimed = 2,
}

public sealed record ProspectMemberDto(string Name, int Age);

/// <summary>A prospect as Saturdaze Admin sees it; <see cref="Weekend"/> is present on the single read and on writes.</summary>
public sealed record ProspectDto(
    Guid Id,
    string FamilyName,
    string HomeLocation,
    IReadOnlyList<ProspectMemberDto> Members,
    IReadOnlyList<string> Likes,
    DateOnly WeekendOf,
    Guid WeekendId,
    ProspectStatus Status,
    DateTimeOffset CreatedAtUtc,
    int InvitationCount,
    WeekendDto? Weekend);
