using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Contracts;

public sealed record FamilyProfileDto(
    Guid Id,
    string? Name,
    string HomeLocation,
    bool BudgetEnabled,
    bool TryNewEnabled,
    bool FridayPreviewEnabled,
    IReadOnlyList<FamilyMemberDto> Members,
    IReadOnlyList<CommitmentDto> Commitments,
    IReadOnlyList<PreferenceDto> Preferences,
    bool IsOwner = false,
    string? OwnerEmail = null,
    LocationDto? HomeCoordinates = null,
    int MaxDriveMinutes = 120,
    IReadOnlyList<string>? ExcludedThemes = null,
    bool QuietSunday = false,
    TimeOnly? DayStart = null,
    TimeOnly? YoungestBedtime = null,
    bool SundayDinnerAtHome = true,
    int OutingsPerDay = 2,
    PlanLeaning Leaning = PlanLeaning.Either);

/// <param name="Email">The invited or signed-in address; null when <see cref="Access"/> is None.</param>
public sealed record FamilyMemberDto(
    Guid Id,
    string Name,
    int Age,
    MemberAccess Access = MemberAccess.None,
    string? Email = null,
    IReadOnlyList<string>? Interests = null);

public sealed record CommitmentDto(
    Guid Id,
    string Title,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    IReadOnlyList<Guid>? AttendeeMemberIds = null,
    LocationDto? Location = null);

public sealed record PreferenceDto(Guid Id, PreferenceKind Kind, string Value);

/// <param name="Invite">The invitation to share with the new member; null when they will not sign in (L2-125).</param>
public sealed record AddFamilyMemberResultDto(FamilyMemberDto Member, FamilyInviteDto? Invite);

/// <param name="Url">The accept-invite link the owner shares (L2-126).</param>
public sealed record FamilyInviteDto(string Email, string Token, string Url, DateTimeOffset ExpiresAtUtc);
