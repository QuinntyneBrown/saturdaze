using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Families;

/// <summary>
/// Full or partial save of the editable profile (L2-010). Every part is
/// optional: an omitted scalar keeps its stored value and an omitted
/// collection is left as it is, while a supplied collection replaces the
/// stored one. A first-time save must supply the home location.
/// </summary>
public sealed record SaveFamilyProfileCommand(
    string? HomeLocation = null,
    bool? BudgetEnabled = null,
    IReadOnlyList<SaveMemberInput>? Members = null,
    IReadOnlyList<SaveCommitmentInput>? Commitments = null,
    IReadOnlyList<SavePreferenceInput>? Preferences = null,
    string? Name = null,
    bool? TryNewEnabled = null,
    bool? FridayPreviewEnabled = null) : IRequest<FamilyProfileDto>;

/// <summary>Members match by <see cref="Id"/> when supplied (so a rename keeps its row), else by name.</summary>
public sealed record SaveMemberInput(string Name, int Age, Guid? Id = null);

/// <summary>Commitments match by <see cref="Id"/> when supplied, else by (title, day).</summary>
public sealed record SaveCommitmentInput(
    string Title,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    Guid? Id = null);

public sealed record SavePreferenceInput(PreferenceKind Kind, string Value);
