using MediatR;
using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Families;

/// <summary>
/// Full-replace of the editable profile. The three optional scalars leave
/// the stored value untouched when omitted so older clients keep working.
/// </summary>
public sealed record SaveFamilyProfileCommand(
    string HomeLocation,
    bool BudgetEnabled,
    IReadOnlyList<SaveMemberInput> Members,
    IReadOnlyList<SaveCommitmentInput> Commitments,
    IReadOnlyList<SavePreferenceInput> Preferences,
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
