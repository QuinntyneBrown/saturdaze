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
    string? OwnerEmail = null);

/// <param name="Email">The invited or signed-in address; null when <see cref="Access"/> is None.</param>
public sealed record FamilyMemberDto(
    Guid Id,
    string Name,
    int Age,
    MemberAccess Access = MemberAccess.None,
    string? Email = null);

public sealed record CommitmentDto(
    Guid Id,
    string Title,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime);

public sealed record PreferenceDto(Guid Id, PreferenceKind Kind, string Value);
