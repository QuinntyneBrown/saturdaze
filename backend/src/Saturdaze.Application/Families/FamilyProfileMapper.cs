using Saturdaze.Application.Contracts;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;

namespace Saturdaze.Application.Families;

internal static class FamilyProfileMapper
{
    /// <param name="invited">Outstanding invitation email per member id.</param>
    /// <param name="accounts">Sign-in email per user id, for members with an account.</param>
    public static FamilyProfileDto ToDto(
        Family family,
        bool isOwner,
        string? ownerEmail,
        IReadOnlyDictionary<Guid, string> invited,
        IReadOnlyDictionary<Guid, string> accounts) => new(
        family.Id,
        family.Name,
        family.HomeLocation,
        family.BudgetEnabled,
        family.TryNewEnabled,
        family.FridayPreviewEnabled,
        family.Members
            .OrderBy(m => m.Age)
            .Select(m => ToDto(m, invited, accounts))
            .ToList(),
        family.Commitments
            .OrderBy(c => ((int)c.DayOfWeek + 1) % 7) // Sat=0, Sun=1, Mon=2, ...
            .ThenBy(c => c.StartTime)
            .Select(c => new CommitmentDto(c.Id, c.Title, c.DayOfWeek, c.StartTime, c.EndTime))
            .ToList(),
        family.Preferences
            .OrderBy(p => p.Kind).ThenBy(p => p.Value)
            .Select(p => new PreferenceDto(p.Id, p.Kind, p.Value))
            .ToList(),
        isOwner,
        ownerEmail);

    private static FamilyMemberDto ToDto(
        FamilyMember member,
        IReadOnlyDictionary<Guid, string> invited,
        IReadOnlyDictionary<Guid, string> accounts)
    {
        if (member.UserId is { } userId && accounts.TryGetValue(userId, out var account))
            return new FamilyMemberDto(member.Id, member.Name, member.Age, MemberAccess.Account, account);
        if (invited.TryGetValue(member.Id, out var email))
            return new FamilyMemberDto(member.Id, member.Name, member.Age, MemberAccess.Invited, email);
        return new FamilyMemberDto(member.Id, member.Name, member.Age);
    }
}
