using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Saturdaze.Domain.Entities;
using Saturdaze.Domain.Enums;
using Saturdaze.Infrastructure.Persistence;

namespace Saturdaze.Cli.Seed;

public sealed class FamilySeeder : IJsonSeeder
{
    public string FileName => "family.json";

    public async Task<int> SeedAsync(AppDbContext db, Stream json, CancellationToken ct)
    {
        var seed = await JsonSerializer.DeserializeAsync<FamilyRecord>(
            json, SeedJsonOptions.Default, ct);
        if (seed is null || string.IsNullOrWhiteSpace(seed.HomeLocation))
            return 0;

        var family = await db.Families
            .Include(f => f.Members)
            .Include(f => f.Commitments)
            .Include(f => f.Preferences)
            .FirstOrDefaultAsync(f => f.HomeLocation == seed.HomeLocation, ct);

        if (family is null)
        {
            family = new Family { Id = Guid.NewGuid(), HomeLocation = seed.HomeLocation };
            db.Families.Add(family);
        }

        family.BudgetEnabled = seed.BudgetEnabled;

        var written = 1;
        written += UpsertMembers(family, seed.Members);
        written += UpsertCommitments(family, seed.Commitments);
        written += UpsertPreferences(family, seed.Preferences);
        return written;
    }

    private static int UpsertMembers(Family family, IReadOnlyList<MemberRecord>? records)
    {
        if (records is null) return 0;
        var count = 0;
        foreach (var ms in records)
        {
            if (string.IsNullOrWhiteSpace(ms.Name)) continue;

            var member = family.Members.FirstOrDefault(m =>
                string.Equals(m.Name, ms.Name, StringComparison.OrdinalIgnoreCase));

            if (member is null)
            {
                family.Members.Add(new FamilyMember
                {
                    Id = Guid.NewGuid(),
                    FamilyId = family.Id,
                    Name = ms.Name,
                    Age = ms.Age
                });
            }
            else
            {
                member.Age = ms.Age;
            }
            count++;
        }
        return count;
    }

    private static int UpsertCommitments(Family family, IReadOnlyList<CommitmentRecord>? records)
    {
        if (records is null) return 0;
        var count = 0;
        foreach (var cs in records)
        {
            if (string.IsNullOrWhiteSpace(cs.Title)) continue;

            var existing = family.Commitments
                .FirstOrDefault(c => c.Title == cs.Title && c.DayOfWeek == cs.DayOfWeek);

            if (existing is null)
            {
                family.Commitments.Add(new Commitment
                {
                    Id = Guid.NewGuid(),
                    FamilyId = family.Id,
                    Title = cs.Title,
                    DayOfWeek = cs.DayOfWeek,
                    StartTime = cs.StartTime,
                    EndTime = cs.EndTime
                });
            }
            else
            {
                existing.StartTime = cs.StartTime;
                existing.EndTime = cs.EndTime;
            }
            count++;
        }
        return count;
    }

    private static int UpsertPreferences(Family family, IReadOnlyList<PreferenceRecord>? records)
    {
        if (records is null) return 0;
        var count = 0;
        foreach (var ps in records)
        {
            if (string.IsNullOrWhiteSpace(ps.Value)) continue;

            var exists = family.Preferences.Any(p => p.Kind == ps.Kind && p.Value == ps.Value);
            if (!exists)
            {
                family.Preferences.Add(new Preference
                {
                    Id = Guid.NewGuid(),
                    FamilyId = family.Id,
                    Kind = ps.Kind,
                    Value = ps.Value
                });
            }
            count++;
        }
        return count;
    }

    private sealed record FamilyRecord(
        string HomeLocation,
        bool BudgetEnabled,
        List<MemberRecord>? Members,
        List<CommitmentRecord>? Commitments,
        List<PreferenceRecord>? Preferences);

    private sealed record MemberRecord(string Name, int Age);

    private sealed record CommitmentRecord(
        string Title,
        DayOfWeek DayOfWeek,
        TimeOnly StartTime,
        TimeOnly EndTime);

    private sealed record PreferenceRecord(PreferenceKind Kind, string Value);
}
