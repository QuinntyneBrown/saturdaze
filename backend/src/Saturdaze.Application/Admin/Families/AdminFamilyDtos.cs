using Saturdaze.Application.Contracts;

namespace Saturdaze.Application.Admin.Families;

/// <summary>One family as the Families screen lists it (L2-157).</summary>
public sealed record AdminFamilyDto(
    Guid Id,
    string Name,
    string HomeLocation,
    int MemberCount,
    IReadOnlyList<string> Accounts,
    string? OwnerEmail,
    AdminWeekendSummaryDto? Upcoming);

/// <summary>The family's weekend for the upcoming Saturday, when one exists.</summary>
public sealed record AdminWeekendSummaryDto(
    Guid Id,
    DateOnly WeekendOf,
    string? Title,
    int BlockCount,
    int LockedCount,
    int RegenerateCount);

/// <summary>A page of <see cref="AdminFamilyDto"/>.</summary>
public sealed record AdminFamilyPageDto(IReadOnlyList<AdminFamilyDto> Items, int Total, int Page, int PageSize);

/// <summary>One family with what the planner works from (L2-159).</summary>
public sealed record AdminFamilyDetailDto(
    AdminFamilyDto Family,
    DateOnly UpcomingWeekendOf,
    IReadOnlyList<FamilyMemberDto> Members,
    IReadOnlyList<CommitmentDto> Commitments);
