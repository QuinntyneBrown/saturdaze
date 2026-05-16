using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Contracts;

public sealed record FamilyProfileDto(
    Guid Id,
    string HomeLocation,
    bool BudgetEnabled,
    IReadOnlyList<FamilyMemberDto> Members,
    IReadOnlyList<CommitmentDto> Commitments,
    IReadOnlyList<PreferenceDto> Preferences);

public sealed record FamilyMemberDto(Guid Id, string Name, int Age);

public sealed record CommitmentDto(
    Guid Id,
    string Title,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime);

public sealed record PreferenceDto(Guid Id, PreferenceKind Kind, string Value);
