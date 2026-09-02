using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Entities;

namespace Saturdaze.Application.Families;

internal static class FamilyProfileMapper
{
    public static FamilyProfileDto ToDto(Family family) => new(
        family.Id,
        family.Name,
        family.HomeLocation,
        family.BudgetEnabled,
        family.TryNewEnabled,
        family.FridayPreviewEnabled,
        family.Members
            .OrderBy(m => m.Age)
            .Select(m => new FamilyMemberDto(m.Id, m.Name, m.Age))
            .ToList(),
        family.Commitments
            .OrderBy(c => ((int)c.DayOfWeek + 1) % 7) // Sat=0, Sun=1, Mon=2, ...
            .ThenBy(c => c.StartTime)
            .Select(c => new CommitmentDto(c.Id, c.Title, c.DayOfWeek, c.StartTime, c.EndTime))
            .ToList(),
        family.Preferences
            .OrderBy(p => p.Kind).ThenBy(p => p.Value)
            .Select(p => new PreferenceDto(p.Id, p.Kind, p.Value))
            .ToList());
}
