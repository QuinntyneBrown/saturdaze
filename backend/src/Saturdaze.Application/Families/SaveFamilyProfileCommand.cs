using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Families;

public sealed record SaveFamilyProfileCommand(
    string HomeLocation,
    bool BudgetEnabled,
    IReadOnlyList<SaveMemberInput> Members,
    IReadOnlyList<SaveCommitmentInput> Commitments,
    IReadOnlyList<SavePreferenceInput> Preferences) : IRequest<FamilyProfileDto>;

public sealed record SaveMemberInput(string Name, int Age);

public sealed record SaveCommitmentInput(
    string Title,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime);

public sealed record SavePreferenceInput(PreferenceKind Kind, string Value);
